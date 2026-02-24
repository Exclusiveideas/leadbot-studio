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

    const calls = await prisma.voiceCall.findMany({
      where: {
        chatbotId: chatbot.id,
        startedAt: { gte: startDate, lte: endDate },
      },
      select: {
        status: true,
        durationSeconds: true,
        leadCaptured: true,
        transferredTo: true,
        callerCity: true,
        callerState: true,
        startedAt: true,
      },
    });

    const totalCalls = calls.length;
    const completedCalls = calls.filter((c) => c.status === "COMPLETED").length;
    const voicemailCalls = calls.filter((c) => c.status === "VOICEMAIL").length;
    const leadsFromCalls = calls.filter((c) => c.leadCaptured).length;
    const transferredCalls = calls.filter((c) => c.transferredTo).length;

    const callsWithDuration = calls.filter(
      (c) => c.durationSeconds && c.durationSeconds > 0,
    );
    const avgDurationSeconds =
      callsWithDuration.length > 0
        ? Math.round(
            callsWithDuration.reduce(
              (sum, c) => sum + (c.durationSeconds ?? 0),
              0,
            ) / callsWithDuration.length,
          )
        : 0;

    // Daily call volume
    const dailyMap = new Map<string, number>();
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      dailyMap.set(d.toISOString().split("T")[0], 0);
    }
    for (const call of calls) {
      const dateKey = call.startedAt.toISOString().split("T")[0];
      dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + 1);
    }
    const daily = Array.from(dailyMap.entries()).map(([date, count]) => ({
      date,
      calls: count,
    }));

    // Top caller locations (city/state, top 5)
    const locationCounts = new Map<string, number>();
    for (const call of calls) {
      if (call.callerCity || call.callerState) {
        const location = [call.callerCity, call.callerState]
          .filter(Boolean)
          .join(", ");
        if (location) {
          locationCounts.set(location, (locationCounts.get(location) ?? 0) + 1);
        }
      }
    }
    const topLocations = Array.from(locationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalCalls,
          completedCalls,
          voicemailCalls,
          avgDurationSeconds,
          leadCaptureRate:
            totalCalls > 0
              ? Math.round((leadsFromCalls / totalCalls) * 100)
              : 0,
          completedRate:
            totalCalls > 0
              ? Math.round((completedCalls / totalCalls) * 100)
              : 0,
          transferRate:
            totalCalls > 0
              ? Math.round((transferredCalls / totalCalls) * 100)
              : 0,
        },
        daily,
        topLocations,
        days: clampedDays,
      },
    });
  } catch (error) {
    console.error("Error fetching voice analytics:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
