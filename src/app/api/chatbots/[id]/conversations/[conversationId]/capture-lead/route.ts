import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { parseLeadData } from "@/lib/utils/lead-data-parser";

/**
 * POST /api/chatbots/[id]/conversations/[conversationId]/capture-lead
 * Capture a lead from a conversation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: chatbotId, conversationId } = await params;
    const body = await request.json();

    // Parse lead data (handles both dynamic forms and legacy format)
    let leadData;
    try {
      leadData = parseLeadData(body);
    } catch (error: any) {
      return NextResponse.json(
        {
          error: error.message || "Invalid lead data",
          details: error.details,
        },
        { status: 400 },
      );
    }

    const {
      email,
      name,
      phone,
      caseType,
      urgency,
      budget,
      notes,
      metadata,
      formData,
    } = leadData;

    // Verify conversation belongs to user
    const conversation = await prisma.chatbotConversation.findUnique({
      where: { id: conversationId },
      select: { userId: true, chatbotId: true, leadCaptured: true },
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

    if (conversation.leadCaptured) {
      return NextResponse.json(
        { error: "Lead already captured for this conversation" },
        { status: 409 },
      );
    }

    // Capture lead with dynamic form data
    const lead = await prisma.$transaction(async (tx) => {
      // Create lead
      const createdLead = await tx.chatbotLead.create({
        data: {
          chatbotId,
          conversationId,
          email,
          name,
          phone,
          caseType,
          urgency,
          budget,
          notes,
          metadata: metadata ? (metadata as object) : undefined,
          formData: formData ? (formData as object) : undefined,
        },
      });

      // Update conversation leadCaptured flag
      await tx.chatbotConversation.update({
        where: { id: conversationId },
        data: { leadCaptured: true },
      });

      return createdLead;
    });

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error("Capture lead error:", error);
    return NextResponse.json(
      { error: "Failed to capture lead" },
      { status: 500 },
    );
  }
}
