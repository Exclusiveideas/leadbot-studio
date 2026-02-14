import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

// GET /api/chatbots/[id]/conversations/[conversationId]/messages - Get messages in a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50", 10),
      100,
    );
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Verify conversation belongs to user
    const conversation = await prisma.chatbotConversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
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

    // Get messages
    const messages = await prisma.chatbotMessage.findMany({
      where: { conversationId },
      include: {
        citations: {
          select: {
            id: true,
            knowledgeId: true,
            chunkText: true,
            pageNumber: true,
            relevanceScore: true,
            knowledge: {
              select: {
                title: true,
                type: true,
              },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            s3Key: true,
            size: true,
            mimeType: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      skip: offset,
      take: limit,
    });

    // Format messages
    const formatted = messages.map((msg) => ({
      id: msg.id,
      localId: msg.localId,
      role: msg.role,
      content: msg.content,
      status: msg.status,
      tokensUsed: msg.tokensUsed,
      processingTime: msg.processingTime,
      createdAt: msg.createdAt,
      attachments: msg.attachments,
      sources: msg.citations.map((citation) => ({
        id: citation.knowledgeId,
        name: citation.knowledge.title,
        type: citation.knowledge.type,
        pageNumber: citation.pageNumber,
        relevanceScore: citation.relevanceScore,
      })),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Failed to get messages" },
      { status: 500 },
    );
  }
}

// POST /api/chatbots/[id]/conversations/[conversationId]/messages - Create a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const body = await request.json();
    const { role, content, localId } = body;

    if (!role || !content) {
      return NextResponse.json(
        { error: "Role and content are required" },
        { status: 400 },
      );
    }

    if (role !== "USER" && role !== "ASSISTANT") {
      return NextResponse.json(
        { error: "Role must be USER or ASSISTANT" },
        { status: 400 },
      );
    }

    // Verify conversation belongs to user
    const conversation = await prisma.chatbotConversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
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

    // Create message
    // Use "sent" for USER messages, "completed" for ASSISTANT messages
    const message = await prisma.chatbotMessage.create({
      data: {
        conversationId,
        role,
        content,
        localId,
        status: role === "USER" ? "sent" : "completed",
      },
    });

    return NextResponse.json({
      id: message.id,
      localId: message.localId,
      role: message.role,
      content: message.content,
      status: message.status,
      createdAt: message.createdAt,
    });
  } catch (error) {
    console.error("Create message error:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 },
    );
  }
}
