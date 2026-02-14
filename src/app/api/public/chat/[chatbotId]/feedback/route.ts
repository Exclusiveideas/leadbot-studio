import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema
const feedbackSchema = z.object({
  sessionId: z.string().min(1),
  subject: z.string().min(1).max(200),
  content: z.string().min(1).max(1000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> },
) {
  try {
    const { chatbotId } = await params;

    // Verify chatbot exists (accept both ID and embedCode)
    const chatbot = await prisma.chatbot.findFirst({
      where: {
        OR: [{ id: chatbotId }, { embedCode: chatbotId }],
      },
      select: { id: true },
    });

    if (!chatbot) {
      return NextResponse.json(
        { success: false, error: "Chatbot not found" },
        { status: 404 },
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = feedbackSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid feedback data",
          details: validation.error,
        },
        { status: 400 },
      );
    }

    const { sessionId, subject, content } = validation.data;

    // Extract metadata
    const ipAddress =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      null;
    const userAgent = req.headers.get("user-agent") || null;

    // Create feedback record
    // Use chatbot.id (not chatbotId URL param which could be embedCode)
    const feedback = await prisma.chatbotFeedback.create({
      data: {
        chatbotId: chatbot.id,
        sessionId,
        subject,
        content,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: feedback.id,
        submittedAt: feedback.submittedAt,
      },
    });
  } catch (error) {
    console.error("[Feedback API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit feedback" },
      { status: 500 },
    );
  }
}
