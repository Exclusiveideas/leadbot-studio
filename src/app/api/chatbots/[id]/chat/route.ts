import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { bedrockService } from "@/lib/services/bedrock/service";
import { getChatbotRAG, type ChatbotRAG } from "@/lib/services/chatbot/chatbot-rag";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/utils/audit";
import { prepareBase64FilesForAI } from "@/lib/chat/fileProcessor";
import { buildLeadGenerationSystemPrompt } from "@/lib/services/chatbot/rag";
import { getHotCache } from "@/lib/context/hot-cache";
import { buildChatbotConversationHistory } from "@/lib/utils/chatbotConversationHistoryBuilder";
import { asConversationId, asTokenCount } from "@/lib/context/types";
import { calculateTotalTokens } from "@/lib/context/token-calculator";
import { CacheService } from "@/lib/services/cacheService";
import { checkPromptInjection } from "@/lib/services/security/promptInjectionDetector";
import { MAX_PROMPT_LENGTH } from "@/lib/services/security/constants";
import type { BedrockContentBlock } from "@/types/bedrock";
import type { ChatbotMessage } from "@prisma/client";

interface Base64File {
  name: string;
  mimeType: string;
  size: number;
  base64: string;
}

interface ChatRequest {
  message: string;
  conversationId: string;
  files?: Base64File[];
}

interface ChatStreamEvent {
  type: "start" | "content" | "complete" | "error" | "tool_call";
  content?: string;
  messageId?: string;
  tokensUsed?: number;
  processingTime?: number;
  sources?: Array<{ id: string; name: string; type: string }>;
  error?: {
    code: string;
    message: string;
  };
  toolCall?: {
    name: "show_lead_form";
    parameters: {
      reason: string;
      extractedData?: {
        name?: string;
        email?: string;
        phone?: string;
        caseType?: string;
        urgency?: "IMMEDIATE" | "THIS_WEEK" | "THIS_MONTH" | "EXPLORING";
      };
      urgency: "high" | "medium" | "low";
    };
  };
}

async function handleStreamingRequest(
  chatbotId: string,
  conversationId: string,
  message: string,
  userId: string,
  files?: Base64File[],
): Promise<Response> {
  const startTime = Date.now();
  const encoder = new TextEncoder();
  let accumulatedContent = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 1. Get chatbot configuration
        const chatbot = await prisma.chatbot.findUnique({
          where: { id: chatbotId },
          select: {
            id: true,
            name: true,
            systemPrompt: true,
            persona: true,
            customInstructions: true,
            aiModel: true,
          },
        });

        if (!chatbot) {
          throw new Error("Chatbot not found");
        }

        // Send start event
        const startEvent: ChatStreamEvent = {
          type: "start",
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(startEvent)}\n\n`),
        );

        // Note: User message is now saved by the frontend in parallel with streaming
        // This improves perceived performance by ~50-200ms

        // 3. Check hot cache for conversation history + RAG results
        const cache = getHotCache();
        const cacheKey = asConversationId(conversationId);
        let conversationMessages: ChatbotMessage[];
        let ragResult: Awaited<ReturnType<ChatbotRAG["performRAG"]>>;
        let fromCache = false;

        // Generate query hash for RAG cache validation
        const queryHash = CacheService.hashObject({ message, chatbotId });

        // Get current knowledge base version for cache validation
        const currentKbVersion =
          await getChatbotRAG().getKnowledgeBaseVersion(chatbotId);

        const cached = cache.getChatbotConversation(cacheKey);
        if (
          cached &&
          cached.ragChunks &&
          cached.ragQueryHash === queryHash &&
          cached.knowledgeBaseVersion === currentKbVersion &&
          cached.ragChunks.length > 0
        ) {
          // HIT: Use cached messages + RAG results (1-5ms)
          // Only use cache if query hash matches (same question)
          conversationMessages = cached.messages;
          ragResult = {
            chunks: cached.ragChunks,
            sources: Array.from(
              new Map(
                cached.ragChunks.map((chunk) => [
                  chunk.knowledgeId,
                  {
                    id: chunk.knowledgeId,
                    name: chunk.title,
                    type: chunk.type,
                  },
                ]),
              ).values(),
            ),
            totalFound: cached.ragChunks.length,
            searchTime: 0,
          };
          fromCache = true;

          console.log("[ChatbotCache] Hit:", {
            conversationId,
            messages: conversationMessages.length,
            cachedRagChunks: ragResult.chunks.length,
            queryHash,
          });
        } else {
          // MISS: Load from DB and perform fresh RAG (50-200ms)
          // Cache miss if: no cache, no RAG chunks, or different query
          conversationMessages = await prisma.chatbotMessage.findMany({
            where: { conversationId },
            orderBy: { createdAt: "asc" },
          });

          // Perform RAG retrieval
          ragResult = await getChatbotRAG().performRAG(message, chatbotId, {
            topK: 10,
          });

          console.log("[ChatbotCache] Miss:", {
            conversationId,
            messages: conversationMessages.length,
            reason: !cached
              ? "no-cache"
              : !cached.ragChunks
                ? "no-rag-chunks"
                : cached.ragQueryHash !== queryHash
                  ? "query-changed"
                  : cached.knowledgeBaseVersion !== currentKbVersion
                    ? "knowledge-base-updated"
                    : "unknown",
            queryHash,
            currentKbVersion,
            cachedKbVersion: cached?.knowledgeBaseVersion,
          });
        }

        // 4. Build context from RAG chunks
        const contextString = getChatbotRAG().buildContextString(
          ragResult.chunks,
          5,
        );

        // 5. Build conversation history with token budget management
        // Estimate RAG context tokens (4 chars ≈ 1 token)
        const ragTokens = Math.ceil(contextString.length / 4);

        const historyResult = buildChatbotConversationHistory(
          conversationMessages,
          conversationId,
          {
            useTokenBudget: true,
            ragContextTokens: ragTokens,
          },
        );

        // Log if compaction occurred
        if (historyResult.metadata.wasCompacted) {
          console.warn("[ChatbotContext] Compaction occurred:", {
            conversationId,
            droppedMessages: historyResult.metadata.messagesDropped,
            totalTokens: historyResult.metadata.totalTokens,
            ragTokens: historyResult.metadata.ragTokensUsed,
          });
        }

        // 6. Define tools for lead capture
        const tools = [
          {
            name: "show_lead_form",
            description:
              "Show a lead capture form to collect contact information from the user. Use this when user expresses need for an attorney, shares specific case details, mentions urgency, or asks about consultations.",
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

        // 7. Prepare messages for AI
        const systemPrompt =
          chatbot.systemPrompt ||
          chatbot.persona ||
          buildLeadGenerationSystemPrompt({
            name: chatbot.name,
            customInstructions: chatbot.customInstructions || "",
          });

        const messages: Array<{
          role: "user" | "assistant";
          content: string | BedrockContentBlock[];
        }> = historyResult.messages.map((msg) => ({
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
            onToolUse: (toolCall: any) => {
              // Emit tool call event via SSE
              const toolEvent: ChatStreamEvent = {
                type: "tool_call",
                toolCall: {
                  name: toolCall.name,
                  parameters: toolCall.input,
                },
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(toolEvent)}\n\n`),
              );

              console.log("[ChatbotTool] Tool call emitted:", {
                conversationId,
                toolName: toolCall.name,
                parameters: toolCall.input,
              });
            },
          },
        );

        const processingTime = Date.now() - startTime;
        const totalTokens =
          (aiResponse.usage?.inputTokens || 0) +
          (aiResponse.usage?.outputTokens || 0);

        // 8. Save assistant message with citations
        const assistantMessage = await prisma.chatbotMessage.create({
          data: {
            conversationId,
            role: "ASSISTANT",
            content: accumulatedContent,
            tokensUsed: totalTokens,
            processingTime,
            status: "completed",
            citations: {
              create: ragResult.chunks.slice(0, 3).map((chunk) => ({
                knowledgeId: chunk.knowledgeId,
                chunkText: chunk.text,
                pageNumber: chunk.pageNumber,
                relevanceScore: chunk.score,
              })),
            },
          },
        });

        // 9. Update conversation lastMessageAt
        await prisma.chatbotConversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: new Date() },
        });

        // 10. Update hot cache with new messages + RAG results
        const updatedMessages: ChatbotMessage[] = [
          ...conversationMessages,
          {
            id: assistantMessage.id,
            conversationId,
            role: "ASSISTANT",
            content: accumulatedContent,
            tokensUsed: totalTokens,
            processingTime,
            status: "completed",
            createdAt: assistantMessage.createdAt,
            localId: null,
          } as ChatbotMessage,
        ];

        cache.setChatbotConversation({
          __type: "chatbot",
          conversationId: cacheKey,
          messages: updatedMessages,
          ragChunks: ragResult.chunks,
          ragQueryHash: queryHash, // Cache the query hash for validation
          knowledgeBaseVersion: currentKbVersion, // Cache KB version for invalidation
          totalTokens: asTokenCount(
            historyResult.metadata.totalTokens + totalTokens,
          ),
          messageCount: updatedMessages.length,
          lastUpdated: Date.now(),
          version: 1,
        });

        console.log("[ChatbotCache] Updated:", {
          conversationId,
          messages: updatedMessages.length,
          ragChunks: ragResult.chunks.length,
          queryHash,
          knowledgeBaseVersion: currentKbVersion,
          fromCache,
        });

        // 11. Send complete event
        const completeEvent: ChatStreamEvent = {
          type: "complete",
          messageId: assistantMessage.id,
          content: accumulatedContent,
          tokensUsed: totalTokens,
          processingTime,
          sources: ragResult.sources,
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(completeEvent)}\n\n`),
        );

        // 11. Log audit
        await createAuditLog({
          userId,
          action: "chatbot_message",
          resource: "chatbot_chat",
          resourceId: chatbotId,
          details: {
            conversationId,
            messageLength: message.length,
            tokensUsed: totalTokens,
            processingTime,
            sourcesUsed: ragResult.sources.length,
          },
        });

        controller.close();
      } catch (error) {
        console.error("Chatbot chat streaming error:", error);

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
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ChatRequest = await request.json();
    const { message, conversationId, files } = body;

    if (!message || !conversationId) {
      return NextResponse.json(
        { error: "Message and conversationId are required" },
        { status: 400 },
      );
    }

    // Enforce message length limit to prevent DoS and injection attacks
    if (message.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        {
          error: `Message is too long. Maximum length is ${MAX_PROMPT_LENGTH} characters.`,
        },
        { status: 400 },
      );
    }

    const { id: chatbotId } = await params;

    // Verify conversation belongs to user
    const conversation = await prisma.chatbotConversation.findUnique({
      where: { id: conversationId },
      select: { userId: true, chatbotId: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    if (conversation.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (conversation.chatbotId !== chatbotId) {
      return NextResponse.json(
        { error: "Conversation does not belong to this chatbot" },
        { status: 400 },
      );
    }

    // Check for prompt injection attacks (first line of defense)
    const injectionCheck = await checkPromptInjection(message, {
      userId: session.userId,
      endpoint: "/api/chatbots/[id]/chat",
    });

    if (injectionCheck.blocked) {
      // Return a streaming response with the rejection message for consistent UX
      const encoder = new TextEncoder();
      const blockedStream = new ReadableStream({
        start(controller) {
          const startEvent: ChatStreamEvent = { type: "start" };
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
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Handle streaming
    return handleStreamingRequest(
      chatbotId,
      conversationId,
      message,
      session.userId,
      files,
    );
  } catch (error) {
    console.error("Chatbot chat API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An error occurred processing your request",
      },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatbotId = params.id;

    // Get chatbot with knowledge base stats
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId },
      select: {
        id: true,
        name: true,
        welcomeMessage: true,
        knowledgeBase: {
          select: {
            id: true,
            title: true,
            type: true,
            processedAt: true,
            chunkCount: true,
          },
        },
      },
    });

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    const stats = await getChatbotRAG().getKnowledgeBaseStats(chatbotId);

    return NextResponse.json({
      chatbot: {
        id: chatbot.id,
        name: chatbot.name,
        welcomeMessage: chatbot.welcomeMessage,
      },
      stats,
    });
  } catch (error) {
    console.error("Chatbot GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chatbot" },
      { status: 500 },
    );
  }
}
