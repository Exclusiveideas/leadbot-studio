import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

// GET /api/chatbots/[id]/conversations - List all conversations for a chatbot
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: chatbotId } = await params;

    // Get all conversations for this user and chatbot
    const conversations = await prisma.chatbotConversation.findMany({
      where: {
        chatbotId,
        userId: session.userId,
      },
      select: {
        id: true,
        title: true,
        startedAt: true,
        lastMessageAt: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    const formatted = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      startedAt: conv.startedAt,
      lastMessageAt: conv.lastMessageAt,
      messageCount: conv._count.messages,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("List conversations error:", error);
    return NextResponse.json(
      { error: "Failed to list conversations" },
      { status: 500 },
    );
  }
}

// POST /api/chatbots/[id]/conversations - Create new conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: chatbotId } = await params;
    const body = await request.json();
    const { title } = body;

    // Verify chatbot exists
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId },
      select: { id: true },
    });

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    // Create conversation
    const conversation = await prisma.chatbotConversation.create({
      data: {
        chatbotId,
        userId: session.userId,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        title: title || "New Chat",
      },
      select: {
        id: true,
        title: true,
        startedAt: true,
        lastMessageAt: true,
      },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Create conversation error:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 },
    );
  }
}
