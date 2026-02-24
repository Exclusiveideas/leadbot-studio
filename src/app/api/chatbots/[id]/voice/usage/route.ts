import { withRLS } from "@/lib/middleware/rls-wrapper";
import { NextResponse } from "next/server";
import { getVoiceUsage } from "@/lib/services/voice/voiceUsageService";

/**
 * GET /api/chatbots/[id]/voice/usage
 * Get voice usage stats for the organization
 */
export const GET = withRLS(
  async (_request, session, _rlsContext, tx, context) => {
    const { id } = await context.params;

    const chatbot = await tx.chatbot.findUnique({
      where: { id },
      select: {
        organizationId: true,
        organization: { select: { plan: true } },
      },
    });

    if (!chatbot || chatbot.organizationId !== session.user.organization.id) {
      return NextResponse.json(
        { success: false, error: "Chatbot not found" },
        { status: 404 },
      );
    }

    const usage = await getVoiceUsage(
      tx,
      chatbot.organizationId ?? "",
      chatbot.organization?.plan ?? null,
    );

    return NextResponse.json({ success: true, data: usage });
  },
  { routeName: "GET /api/chatbots/[id]/voice/usage" },
);
