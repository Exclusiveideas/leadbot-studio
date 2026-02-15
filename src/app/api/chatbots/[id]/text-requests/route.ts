import type { TextRequestStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { chatbotTextService } from "@/lib/services/chatbotTextService";
import { getChatbot } from "@/lib/services/chatbotService";

/**
 * GET /api/chatbots/[id]/text-requests - List all text requests for a chatbot
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const chatbot = await getChatbot(id);
    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    if (chatbot.organizationId !== session.organization.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as TextRequestStatus | null;
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const { textRequests, total } = await chatbotTextService.listTextRequests(
      id,
      {
        status: status || undefined,
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
        limit,
        offset,
      },
    );

    const stats = await chatbotTextService.getTextRequestStats(id);

    return NextResponse.json({
      data: textRequests,
      total,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: offset + textRequests.length < total,
      },
    });
  } catch (error) {
    console.error("Error listing text requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
