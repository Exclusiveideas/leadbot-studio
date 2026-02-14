import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { chatbotTextService } from "@/lib/services/chatbotTextService";
import { updateTextRequestStatusSchema } from "@/lib/validation/chatbot-text";

/**
 * GET /api/chatbots/[id]/text-requests/[textRequestId] - Get a single text request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; textRequestId: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, textRequestId } = await params;

    const textRequest = await chatbotTextService.getTextRequest(textRequestId);
    if (!textRequest) {
      return NextResponse.json(
        { error: "Text request not found" },
        { status: 404 },
      );
    }

    if (textRequest.chatbotId !== id) {
      return NextResponse.json(
        { error: "Text request not found" },
        { status: 404 },
      );
    }

    if (
      textRequest.chatbot.createdBy !== session.userId &&
      textRequest.chatbot.organizationId !== session.organization?.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ data: textRequest });
  } catch (error) {
    console.error("Error getting text request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/chatbots/[id]/text-requests/[textRequestId] - Update text request status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; textRequestId: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, textRequestId } = await params;

    const textRequest = await chatbotTextService.getTextRequest(textRequestId);
    if (!textRequest) {
      return NextResponse.json(
        { error: "Text request not found" },
        { status: 404 },
      );
    }

    if (textRequest.chatbotId !== id) {
      return NextResponse.json(
        { error: "Text request not found" },
        { status: 404 },
      );
    }

    if (
      textRequest.chatbot.createdBy !== session.userId &&
      textRequest.chatbot.organizationId !== session.organization?.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = updateTextRequestStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues },
        { status: 400 },
      );
    }

    const updated = await chatbotTextService.updateTextRequestStatus(
      textRequestId,
      result.data.status,
    );

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error updating text request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
