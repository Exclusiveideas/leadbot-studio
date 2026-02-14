import { getSession } from "@/lib/auth/session";
import {
  getSupabaseServerClient,
  ensureServerSide,
} from "@/lib/supabase-server";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import type { RealtimeChannel } from "@supabase/supabase-js";

// Ensure this only runs on the server
ensureServerSide();

interface StreamConnection {
  chatbotId: string;
  controller: ReadableStreamDefaultController;
  channel: RealtimeChannel | null;
  closed: boolean;
}

// Track active connections
const activeConnections = new Map<string, StreamConnection>();

// Clean up connection helper
function cleanupConnection(connectionId: string) {
  const connection = activeConnections.get(connectionId);
  if (connection) {
    connection.closed = true;
    if (connection.channel) {
      const supabase = getSupabaseServerClient();
      supabase.removeChannel(connection.channel);
    }
    activeConnections.delete(connectionId);
    console.log(
      `[ChatbotKnowledge Stream] Cleaned up connection: ${connectionId}`,
    );
  }
}

// Helper to safely enqueue data to controller
function safeEnqueue(connection: StreamConnection, data: string): boolean {
  if (connection.closed) {
    return false;
  }

  try {
    // Double-check controller state before enqueuing
    if (!connection.controller) {
      connection.closed = true;
      return false;
    }

    connection.controller.enqueue(data);
    return true;
  } catch (error: any) {
    // Mark connection as closed on any controller error
    connection.closed = true;

    // Only log if it's not a standard close scenario
    if (
      error.name !== "TypeError" ||
      !error.message?.includes("Controller is already closed")
    ) {
      console.error(
        `[ChatbotKnowledge Stream] Controller error for chatbot ${connection.chatbotId}:`,
        error.message || error,
      );
    }

    return false;
  }
}

// Process real-time events
function processRealtimeEvent(payload: any, connection: StreamConnection) {
  if (connection.closed) return;

  try {
    const { eventType, new: newKnowledge, old: oldKnowledge } = payload;
    console.log(
      `[ChatbotKnowledge Stream] Processing ${eventType} for chatbot ${connection.chatbotId}`,
    );

    // Send the event to the client
    const eventData = {
      eventType,
      knowledge: newKnowledge || oldKnowledge,
      timestamp: new Date().toISOString(),
    };

    safeEnqueue(connection, `data: ${JSON.stringify(eventData)}\n\n`);
  } catch (error) {
    console.error("[ChatbotKnowledge Stream] Error processing event:", error);
    // Send error event to client
    safeEnqueue(
      connection,
      `data: ${JSON.stringify({ eventType: "ERROR", error: "Failed to process knowledge update" })}\n\n`,
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Validate session
    const session = await getSession();
    if (!session?.userId) {
      console.log(
        `[ChatbotKnowledge Stream] Session check failed. session.userId: ${session?.userId}`,
      );
      return new Response("Unauthorized", { status: 401 });
    }

    const { id: chatbotId } = await params;
    const { searchParams } = new URL(request.url);
    const includeCompleted = searchParams.get("includeCompleted") === "true";

    console.log(
      `[ChatbotKnowledge Stream] Starting SSE connection for chatbot: ${chatbotId}`,
    );

    // Verify user has access to this chatbot
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId },
      select: { organizationId: true, createdBy: true },
    });

    if (!chatbot) {
      return new Response("Chatbot not found", { status: 404 });
    }

    // Check access rights (same logic as GET /api/chatbots/[id]/knowledge)
    const hasOrgAccess =
      chatbot.organizationId &&
      chatbot.organizationId === session.organization?.id;
    const hasCreatorAccess =
      !chatbot.organizationId && chatbot.createdBy === session.userId;

    if (!hasOrgAccess && !hasCreatorAccess) {
      return new Response("Access denied", { status: 403 });
    }

    // Create unique connection ID
    const connectionId = `${chatbotId}-${Date.now()}`;

    // Set up Server-Sent Events stream
    const stream = new ReadableStream({
      start(controller) {
        // Store connection info first
        const connection: StreamConnection = {
          chatbotId,
          controller,
          channel: null,
          closed: false,
        };
        activeConnections.set(connectionId, connection);

        // Send initial connection event
        if (
          !safeEnqueue(
            connection,
            `data: ${JSON.stringify({
              eventType: "CONNECTED",
              chatbotId,
              includeCompleted,
            })}\n\n`,
          )
        )
          return;

        // Fetch and send initial data synchronously
        (async () => {
          try {
            // Build where clause for filtering
            const whereClause: any = {
              chatbotId,
            };

            if (!includeCompleted) {
              whereClause.status = {
                notIn: ["COMPLETED", "FAILED"],
              };
            }

            // Use Prisma to fetch knowledge items
            const knowledgeItems = await prisma.chatbotKnowledge.findMany({
              where: whereClause,
              orderBy: {
                createdAt: "desc",
              },
            });

            console.log(
              `[ChatbotKnowledge Stream] Fetched ${knowledgeItems?.length || 0} knowledge items for chatbot ${chatbotId}`,
            );

            // Send initial knowledge items
            safeEnqueue(
              connection,
              `data: ${JSON.stringify({
                eventType: "INITIAL_DATA",
                knowledgeItems: knowledgeItems || [],
                count: knowledgeItems?.length || 0,
              })}\n\n`,
            );

            // Set up real-time subscription for knowledge changes
            const channelName = `chatbot-knowledge-${chatbotId}-${Date.now()}`;

            // Get Supabase client for real-time subscription
            const supabase = getSupabaseServerClient();

            const channel = supabase
              .channel(channelName)
              .on(
                "postgres_changes",
                {
                  event: "*",
                  schema: "public",
                  table: "chatbot_knowledge",
                },
                (payload) => {
                  // Filter on the client side since RLS filtering in subscriptions can be complex
                  const knowledge = payload.new || payload.old;
                  if (knowledge && knowledge.chatbotId === chatbotId) {
                    processRealtimeEvent(payload, connection);
                  }
                },
              )
              .subscribe((status) => {
                console.log(
                  `[ChatbotKnowledge Stream] Subscription status for chatbot ${chatbotId}:`,
                  status,
                );

                if (status === "SUBSCRIBED") {
                  safeEnqueue(
                    connection,
                    `data: ${JSON.stringify({
                      eventType: "SUBSCRIBED",
                      status: "Real-time WebSocket connection established",
                      channelName,
                    })}\n\n`,
                  );
                } else if (status === "CHANNEL_ERROR") {
                  console.error(
                    `[ChatbotKnowledge Stream] Channel error for chatbot ${chatbotId}`,
                  );
                  safeEnqueue(
                    connection,
                    `data: ${JSON.stringify({
                      eventType: "ERROR",
                      error: "Real-time subscription failed",
                    })}\n\n`,
                  );
                }
              });

            connection.channel = channel;
          } catch (error) {
            console.error(
              "[ChatbotKnowledge Stream] Error in initial setup:",
              error,
            );
            safeEnqueue(
              connection,
              `data: ${JSON.stringify({
                eventType: "ERROR",
                error: "Failed to initialize stream",
              })}\n\n`,
            );
          }
        })();
      },

      cancel() {
        console.log(
          `[ChatbotKnowledge Stream] Client disconnected: ${connectionId}`,
        );
        cleanupConnection(connectionId);
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (error) {
    console.error("[ChatbotKnowledge Stream] Error setting up stream:", error);
    return new Response(
      JSON.stringify({ error: "Failed to establish real-time connection" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Handle connection cleanup on process termination
process.on("SIGTERM", () => {
  console.log(
    "[ChatbotKnowledge Stream] Cleaning up all connections on SIGTERM",
  );
  activeConnections.forEach((_, connectionId) => {
    cleanupConnection(connectionId);
  });
});

process.on("SIGINT", () => {
  console.log(
    "[ChatbotKnowledge Stream] Cleaning up all connections on SIGINT",
  );
  activeConnections.forEach((_, connectionId) => {
    cleanupConnection(connectionId);
  });
});
