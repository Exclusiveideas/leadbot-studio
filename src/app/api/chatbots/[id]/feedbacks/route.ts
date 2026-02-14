import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: chatbotId } = await params;

    // Verify user has access to this chatbot
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId },
      select: {
        id: true,
        createdBy: true,
        organizationId: true,
      },
    });

    if (!chatbot) {
      return NextResponse.json(
        { success: false, error: "Chatbot not found" },
        { status: 404 },
      );
    }

    const isCreator = session.userId === chatbot.createdBy;

    if (!isCreator && chatbot.organizationId) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { organizationId: true },
      });

      if (user?.organizationId !== chatbot.organizationId) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 },
        );
      }
    }

    // Fetch feedbacks
    const feedbacks = await prisma.chatbotFeedback.findMany({
      where: { chatbotId },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        sessionId: true,
        subject: true,
        content: true,
        submittedAt: true,
        ipAddress: true,
        userAgent: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: feedbacks,
    });
  } catch (error) {
    console.error("[Feedbacks API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch feedbacks" },
      { status: 500 },
    );
  }
}
