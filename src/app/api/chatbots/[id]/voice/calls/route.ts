import { withRLS } from "@/lib/middleware/rls-wrapper";
import { NextResponse } from "next/server";

/**
 * GET /api/chatbots/[id]/voice/calls
 * List voice calls for a chatbot (paginated)
 */
export const GET = withRLS(
  async (request, session, _rlsContext, tx, context) => {
    const { id } = await context.params;

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

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") ?? "20", 10),
      100,
    );
    const status = url.searchParams.get("status");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { chatbotId: id };
    if (status) where.status = status;

    const [calls, total] = await Promise.all([
      tx.voiceCall.findMany({
        where,
        orderBy: { startedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          twilioCallSid: true,
          direction: true,
          status: true,
          callerNumber: true,
          callerCity: true,
          callerState: true,
          startedAt: true,
          endedAt: true,
          durationSeconds: true,
          leadCaptured: true,
          summary: true,
        },
      }),
      tx.voiceCall.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: calls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  },
  { routeName: "GET /api/chatbots/[id]/voice/calls" },
);
