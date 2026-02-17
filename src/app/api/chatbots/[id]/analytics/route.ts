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

    if (
      chatbot.createdBy !== session.userId &&
      chatbot.organizationId !== session.organization?.id
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const clampedDays = Math.min(Math.max(days, 7), 90);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - clampedDays + 1);
    startDate.setHours(0, 0, 0, 0);

    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - clampedDays);

    // Fetch current period and previous period in parallel
    const [currentPeriod, previousPeriod] = await Promise.all([
      prisma.chatbotDailyAnalytics.findMany({
        where: {
          chatbotId: chatbot.id,
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: "asc" },
      }),
      prisma.chatbotDailyAnalytics.aggregate({
        where: {
          chatbotId: chatbot.id,
          date: { gte: prevStartDate, lt: startDate },
        },
        _sum: {
          conversations: true,
          messages: true,
          leads: true,
        },
      }),
    ]);

    const totalConversations = currentPeriod.reduce(
      (sum, d) => sum + d.conversations,
      0,
    );
    const totalMessages = currentPeriod.reduce((sum, d) => sum + d.messages, 0);
    const totalLeads = currentPeriod.reduce((sum, d) => sum + d.leads, 0);

    const prevConversations = previousPeriod._sum.conversations ?? 0;
    const prevMessages = previousPeriod._sum.messages ?? 0;
    const prevLeads = previousPeriod._sum.leads ?? 0;

    const trend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const daily = currentPeriod.map((d) => ({
      date: d.date.toISOString().split("T")[0],
      conversations: d.conversations,
      messages: d.messages,
      leads: d.leads,
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalConversations,
          totalMessages,
          totalLeads,
          conversationsTrend: trend(totalConversations, prevConversations),
          messagesTrend: trend(totalMessages, prevMessages),
          leadsTrend: trend(totalLeads, prevLeads),
        },
        daily,
        days: clampedDays,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
