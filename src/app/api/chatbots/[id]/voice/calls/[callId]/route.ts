import { withRLS } from "@/lib/middleware/rls-wrapper";
import { NextResponse } from "next/server";

/**
 * GET /api/chatbots/[id]/voice/calls/[callId]
 * Get details of a specific voice call including transcript
 */
export const GET = withRLS(
  async (_request, session, _rlsContext, tx, context) => {
    const { id, callId } = await context.params;

    const chatbot = await tx.chatbot.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!chatbot || chatbot.organizationId !== session.user.organization.id) {
      return NextResponse.json(
        { success: false, error: "Chatbot not found" },
        { status: 404 },
      );
    }

    const call = await tx.voiceCall.findFirst({
      where: { id: callId, chatbotId: id },
    });

    if (!call) {
      return NextResponse.json(
        { success: false, error: "Call not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: call });
  },
  { routeName: "GET /api/chatbots/[id]/voice/calls/[callId]" },
);
