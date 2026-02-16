import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bedrockService } from "@/lib/services/bedrock/service";
import { getChatbotRAG } from "@/lib/services/chatbot/chatbot-rag";
import { buildLeadGenerationSystemPrompt } from "@/lib/services/chatbot/rag";
import { prepareBase64FilesForAI } from "@/lib/chat/fileProcessor";
import { checkRateLimit } from "@/lib/middleware/rateLimiter";
import {
  recordNewConversation,
  recordMessages,
} from "@/lib/services/publicChatAnalyticsService";
import { checkPromptInjection } from "@/lib/services/security/promptInjectionDetector";
import type { BedrockContentBlock } from "@/types/bedrock";
import { z } from "zod";

// Rate limit: 30 requests per minute for public endpoints
const PUBLIC_RATE_LIMIT = 30;
const PUBLIC_RATE_WINDOW_MS = 60 * 1000;

// Request body schema for public chat
const publicChatMessageSchema = z.object({
  message: z.string().min(1).max(10000),
  sessionId: z.string().min(1),
  isNewSession: z.boolean().default(false),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .default([]),
  files: z
    .array(
      z.object({
        name: z.string(),
        mimeType: z.string(),
        size: z.number(),
        base64: z.string(),
      }),
    )
    .optional(),
});

type PublicChatMessage = z.infer<typeof publicChatMessageSchema>;

interface Base64File {
  name: string;
  mimeType: string;
  size: number;
  base64: string;
}

interface ChatStreamEvent {
  type: "start" | "content" | "complete" | "error" | "tool_call";
  content?: string;
  tokensUsed?: number;
  processingTime?: number;
  sessionId?: string;
  error?: {
    code: string;
    message: string;
  };
  toolCall?: {
    name: "show_lead_form" | "show_booking_trigger";
    parameters: {
      reason: string;
      extractedData?: {
        name?: string;
        email?: string;
        phone?: string;
        caseType?: string;
        urgency?: "IMMEDIATE" | "THIS_WEEK" | "THIS_MONTH" | "EXPLORING";
      };
      urgency?: "high" | "medium" | "low";
    };
    calendlyLink?: string;
    isContactCapture?: boolean;
  };
}

/**
 * Build CORS headers for public chatbot endpoints
 */
function buildCorsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
  };
}

/**
 * Check if the request origin is the app's own domain (dashboard preview).
 */
function isSameOrigin(request: NextRequest): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const origin = request.headers.get("origin");
  if (origin === appUrl) return true;
  const referer = request.headers.get("referer");
  if (referer?.startsWith(appUrl)) return true;
  return false;
}

/**
 * Get client IP for rate limiting
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * OPTIONS /api/public/chat/[chatbotId]
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");

  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(origin),
  });
}

/**
 * GET /api/public/chat/[chatbotId]
 * Get chatbot configuration (for widget initialization)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> },
) {
  const { chatbotId } = await params;
  const origin = request.headers.get("origin");

  try {
    // Accept both chatbot ID and embedCode
    const chatbot = await prisma.chatbot.findFirst({
      where: {
        OR: [{ id: chatbotId }, { embedCode: chatbotId }],
      },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        welcomeMessage: true,
        chatGreeting: true,
        appearance: true,
        suggestedQuestions: true,
        allowedDomains: true,
        calendlyLink: true,
        bookingConfig: true,
        textConfig: true,
      },
    });

    if (!chatbot) {
      return NextResponse.json(
        { error: "Chatbot not found" },
        { status: 404, headers: buildCorsHeaders(origin) },
      );
    }

    // Check CORS — skip for dashboard preview (same origin)
    if (
      !isSameOrigin(request) &&
      !chatbot.allowedDomains.includes("*") &&
      !chatbot.allowedDomains.includes(origin || "")
    ) {
      return NextResponse.json(
        { error: "Domain not allowed" },
        { status: 403, headers: buildCorsHeaders(origin) },
      );
    }

    // Return chatbot config without allowedDomains (internal field)
    const { allowedDomains: _, ...chatbotData } = chatbot;

    return NextResponse.json(
      {
        success: true,
        data: chatbotData,
      },
      { headers: buildCorsHeaders(origin) },
    );
  } catch (error) {
    console.error("Error fetching chatbot config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: buildCorsHeaders(origin) },
    );
  }
}

/**
 * Handle streaming chat request for public chatbot.
 * Messages are NOT stored in DB - only analytics counters are updated.
 * Conversation history is passed from client localStorage.
 */
async function handleStreamingRequest(
  chatbotId: string,
  sessionId: string,
  message: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  isNewSession: boolean,
  origin: string | null,
  files?: Base64File[],
): Promise<Response> {
  const startTime = Date.now();
  const encoder = new TextEncoder();
  let accumulatedContent = "";

  const corsHeaders = buildCorsHeaders(origin);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send start event immediately to eliminate perceived delay
        const startEvent: ChatStreamEvent = {
          type: "start",
          sessionId,
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(startEvent)}\n\n`),
        );

        // Send a keep-alive comment to force flush (SSE spec allows : comments)
        controller.enqueue(encoder.encode(": keep-alive\n\n"));

        // 1. Get chatbot configuration (accept both ID and embedCode)
        const chatbot = await prisma.chatbot.findFirst({
          where: {
            OR: [{ id: chatbotId }, { embedCode: chatbotId }],
          },
          select: {
            id: true,
            name: true,
            systemPrompt: true,
            persona: true,
            customInstructions: true,
            aiModel: true,
            calendlyLink: true,
          },
        });

        if (!chatbot) {
          throw new Error("Chatbot not found");
        }

        // 2. Record analytics for new session (fire and forget)
        // Use chatbot.id (not chatbotId URL param which could be embedCode)
        if (isNewSession) {
          recordNewConversation(chatbot.id).catch((err) =>
            console.error(
              "[PublicChat] Failed to record new conversation:",
              err,
            ),
          );
        }

        // 3. Perform RAG retrieval using Pinecone vector search
        const ragResult = await getChatbotRAG().performRAG(
          message,
          chatbot.id,
          {
            topK: 10,
          },
        );

        console.log("[PublicChat] RAG result:", {
          chatbotId: chatbot.id,
          chunks: ragResult.chunks.length,
          sources: ragResult.sources.length,
          searchTime: ragResult.searchTime,
        });

        // 4. Build context from RAG chunks
        const contextString = getChatbotRAG().buildContextString(
          ragResult.chunks,
          5,
        );

        // 5. Define tools for lead capture and booking
        const tools: Array<{
          name: string;
          description: string;
          input_schema: {
            type: "object";
            properties: Record<string, unknown>;
            required: string[];
          };
        }> = [
          {
            name: "show_lead_form",
            description:
              "Show a lead capture form to collect contact information. Use when user shares case details, describes their legal situation, or shows interest in services. Do NOT use for booking/scheduling requests - use show_booking_trigger instead.",
            input_schema: {
              type: "object" as const,
              properties: {
                reason: {
                  type: "string",
                  description:
                    "Brief reason for showing the form (e.g., 'User needs urgent custody attorney')",
                },
                extractedData: {
                  type: "object",
                  description:
                    "Contact information and case details extracted from the conversation",
                  properties: {
                    name: {
                      type: "string",
                      description: "User's name if mentioned",
                    },
                    email: {
                      type: "string",
                      description: "User's email if mentioned",
                    },
                    phone: {
                      type: "string",
                      description: "User's phone number if mentioned",
                    },
                    caseType: {
                      type: "string",
                      description:
                        "Type of legal matter (e.g., 'Family Law - Custody')",
                    },
                    urgency: {
                      type: "string",
                      enum: [
                        "IMMEDIATE",
                        "THIS_WEEK",
                        "THIS_MONTH",
                        "EXPLORING",
                      ],
                      description: "How urgent the user's need is",
                    },
                  },
                },
                urgency: {
                  type: "string",
                  enum: ["high", "medium", "low"],
                  description:
                    "Lead priority: high (urgent, deadline), medium (specific details), low (general inquiry)",
                },
              },
              required: ["reason", "urgency"],
            },
          },
        ];

        // Add booking trigger tool (always available - backend handles calendly vs contact form fallback)
        tools.push({
          name: "show_booking_trigger",
          description:
            "IMMEDIATELY show booking form when user wants to book/schedule a call, demo, or meeting. Call this tool RIGHT AWAY - do NOT ask for name, email, or phone first. The tool displays a form to collect contact info automatically.",
          input_schema: {
            type: "object" as const,
            properties: {
              reason: {
                type: "string",
                description:
                  "Brief reason for booking (e.g., 'User wants to schedule a demo')",
              },
            },
            required: ["reason"],
          },
        });

        // 6. Build system prompt with fallback chain
        const basePrompt =
          chatbot.systemPrompt ||
          chatbot.persona ||
          buildLeadGenerationSystemPrompt({
            name: chatbot.name,
            customInstructions: chatbot.customInstructions || "",
          });

        // APPEND tool instructions as FINAL OVERRIDE after persona
        // This ensures they take priority over any conflicting persona instructions
        const toolOverride = `

---
## FINAL INSTRUCTIONS (OVERRIDE ALL ABOVE)

### BOOKING INTENT → use show_booking_trigger tool
When user says "book a call", "schedule a demo", "set up a meeting", or similar:
1. Send ONE short message like "I'd be happy to help you schedule!"
2. IMMEDIATELY call the show_booking_trigger tool
3. Do NOT ask for name, email, phone first - the tool shows a form

### LEAD CAPTURE INTENT → use show_lead_form tool
When user expresses ANY of these, IMMEDIATELY call show_lead_form:
- "I need an attorney" / "I need a lawyer" / "I'm looking for an attorney"
- "I need help with my [case type]" (divorce, custody, child support, etc.)
- "Can you help me find an attorney?"
- "I have a [legal matter]" (hearing, case, dispute, etc.)
- Shares specific case details (names, dates, deadlines, circumstances)
- Expresses urgency about a legal matter ("this is urgent", "I have a deadline")
- Asks "what should I do?" or "what are my options?" about a legal situation

**CRITICAL**: Do NOT deflect or redirect users seeking legal help to other resources.
Your PRIMARY job is to CAPTURE their contact information so an attorney can follow up.
When you detect someone needs legal help, respond with empathy and IMMEDIATELY call show_lead_form.

Example - User: "I need help with my divorce case, I need to divorce my husband"
Response: "I understand this is a difficult time. Let me connect you with one of our family law attorneys who can help with your divorce."
+ IMMEDIATELY call show_lead_form with reason: "User needs divorce attorney", extractedData: { caseType: "Divorce" }, urgency: "high"

### STRICT REQUIREMENTS:
1. When booking OR lead capture intent is detected, call the appropriate tool IMMEDIATELY
2. Do NOT ask for contact info first - the tools display forms to collect it
3. ALWAYS send a brief empathetic message WITH the tool call
`;
        const systemPrompt = basePrompt + toolOverride;

        // 7. Build messages array from client-provided history (filter out empty content)
        const messages: Array<{
          role: "user" | "assistant";
          content: string | BedrockContentBlock[];
        }> = conversationHistory
          .filter((msg) => msg.content.trim() !== "")
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));

        // Prepare user message content (text + optional files)
        let userMessageContent: string | BedrockContentBlock[];

        // Process files if present
        if (files && files.length > 0) {
          const processedFiles = await prepareBase64FilesForAI(files);

          // Add RAG context to the text part
          const messageWithContext = contextString
            ? `Context from knowledge base:\n${contextString}\n\nUser question: ${message}`
            : message;

          // Build multimodal content blocks
          userMessageContent = [
            { type: "text", text: messageWithContext },
            ...processedFiles.contentBlocks,
          ];
        } else {
          // Text-only message with RAG context
          userMessageContent = contextString
            ? `Context from knowledge base:\n${contextString}\n\nUser question: ${message}`
            : message;
        }

        messages.push({
          role: "user" as const,
          content: userMessageContent,
        });

        // 8. Stream AI response with tool support
        const aiResponse = await bedrockService.generateConversationStream(
          messages,
          {
            systemPrompt,
            tools,
            modelConfig: {
              maxTokens: 4096,
              temperature: 0.7,
            },
            maxMessages: 20,
            onChunk: (chunk: string) => {
              accumulatedContent += chunk;

              const contentEvent: ChatStreamEvent = {
                type: "content",
                content: chunk,
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(contentEvent)}\n\n`),
              );
            },
            onToolUse: (toolCall: { name: string; input: unknown }) => {
              let toolEvent: ChatStreamEvent;

              if (toolCall.name === "show_booking_trigger") {
                // Handle booking trigger
                if (chatbot.calendlyLink) {
                  // Calendly link is configured - emit booking event with link
                  toolEvent = {
                    type: "tool_call",
                    toolCall: {
                      name: "show_booking_trigger",
                      parameters: toolCall.input as NonNullable<
                        ChatStreamEvent["toolCall"]
                      >["parameters"],
                      calendlyLink: chatbot.calendlyLink,
                    },
                  };
                } else {
                  // No Calendly link - fallback to contact capture form
                  toolEvent = {
                    type: "tool_call",
                    toolCall: {
                      name: "show_lead_form",
                      parameters: toolCall.input as NonNullable<
                        ChatStreamEvent["toolCall"]
                      >["parameters"],
                      isContactCapture: true,
                    },
                  };
                }
              } else {
                // Regular lead form tool call
                toolEvent = {
                  type: "tool_call",
                  toolCall: {
                    name: toolCall.name as "show_lead_form",
                    parameters: toolCall.input as NonNullable<
                      ChatStreamEvent["toolCall"]
                    >["parameters"],
                  },
                };
              }

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(toolEvent)}\n\n`),
              );

              console.log("[PublicChat] Tool call emitted:", {
                sessionId,
                toolName: toolCall.name,
                parameters: toolCall.input,
                calendlyLink: chatbot.calendlyLink
                  ? "configured"
                  : "not configured",
              });
            },
          },
        );

        const processingTime = Date.now() - startTime;
        const totalTokens =
          (aiResponse.usage?.inputTokens || 0) +
          (aiResponse.usage?.outputTokens || 0);

        // 9. Record message analytics (user + assistant = 2 messages, fire and forget)
        recordMessages(chatbot.id, 2).catch((err) =>
          console.error("[PublicChat] Failed to record messages:", err),
        );

        // 10. Send complete event (no messageId since we don't store in DB)
        const completeEvent: ChatStreamEvent = {
          type: "complete",
          content: accumulatedContent,
          tokensUsed: totalTokens,
          processingTime,
          sessionId,
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(completeEvent)}\n\n`),
        );

        controller.close();
      } catch (error) {
        console.error("Public chatbot streaming error:", error);

        const errorEvent: ChatStreamEvent = {
          type: "error",
          error: {
            code: "AI_SERVICE_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "An error occurred while processing your message",
          },
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
      ...corsHeaders,
    },
  });
}

/**
 * POST /api/public/chat/[chatbotId]
 * Send a message to the chatbot (streaming response).
 * Messages are NOT stored in DB - conversation history is managed client-side.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> },
) {
  const { chatbotId } = await params;
  const origin = request.headers.get("origin");
  const clientIp = getClientIp(request);

  // Rate limiting by IP
  const rateLimitKey = `public-chat:${clientIp}`;
  const rateLimit = await checkRateLimit(
    rateLimitKey,
    PUBLIC_RATE_LIMIT,
    PUBLIC_RATE_WINDOW_MS,
  );

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          ...buildCorsHeaders(origin),
          "Retry-After": String(
            Math.ceil((rateLimit.reset - Date.now()) / 1000),
          ),
        },
      },
    );
  }

  try {
    const body = await request.json();
    const validation = publicChatMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid message data",
          details: validation.error.issues,
        },
        { status: 400, headers: buildCorsHeaders(origin) },
      );
    }

    const { message, sessionId, isNewSession, conversationHistory, files } =
      validation.data;

    // Get chatbot (allow DRAFT for preview, accept both ID and embedCode)
    const chatbot = await prisma.chatbot.findFirst({
      where: {
        OR: [{ id: chatbotId }, { embedCode: chatbotId }],
      },
      select: {
        id: true,
        allowedDomains: true,
      },
    });

    if (!chatbot) {
      return NextResponse.json(
        { error: "Chatbot not found" },
        { status: 404, headers: buildCorsHeaders(origin) },
      );
    }

    // Check CORS — skip for dashboard preview (same origin)
    if (
      !isSameOrigin(request) &&
      !chatbot.allowedDomains.includes("*") &&
      !chatbot.allowedDomains.includes(origin || "")
    ) {
      return NextResponse.json(
        { error: "Domain not allowed" },
        { status: 403, headers: buildCorsHeaders(origin) },
      );
    }

    // Check for prompt injection attacks (first line of defense)
    const injectionCheck = await checkPromptInjection(message, {
      endpoint: "/api/public/chat/[chatbotId]",
      ipAddress: clientIp,
    });

    if (injectionCheck.blocked) {
      // Return a streaming response with the rejection message for consistent UX
      const encoder = new TextEncoder();
      const blockedStream = new ReadableStream({
        start(controller) {
          const startEvent: ChatStreamEvent = {
            type: "start",
            sessionId,
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(startEvent)}\n\n`),
          );

          const contentEvent: ChatStreamEvent = {
            type: "content",
            content: injectionCheck.userResponse,
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(contentEvent)}\n\n`),
          );

          const completeEvent: ChatStreamEvent = {
            type: "complete",
            content: injectionCheck.userResponse,
            tokensUsed: 0,
            processingTime: injectionCheck.result.analysisTimeMs,
            sessionId,
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(completeEvent)}\n\n`),
          );

          controller.close();
        },
      });

      return new Response(blockedStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          ...buildCorsHeaders(origin),
        },
      });
    }

    // Handle streaming response (no DB writes, just analytics counters)
    return handleStreamingRequest(
      chatbotId,
      sessionId,
      message,
      conversationHistory,
      isNewSession,
      origin,
      files as Base64File[] | undefined,
    );
  } catch (error) {
    console.error("Error processing chat message:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500, headers: buildCorsHeaders(origin) },
    );
  }
}
