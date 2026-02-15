import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { notificationService } from "@/lib/services/notificationService";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "20", 10), 1),
      50,
    );

    const notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        data: true,
        read: true,
        createdAt: true,
      },
    });

    const hasMore = notifications.length > limit;
    const results = hasMore ? notifications.slice(0, limit) : notifications;

    const unreadCount = await notificationService.getUnreadCount(
      session.userId,
    );

    return NextResponse.json({
      success: true,
      notifications: results.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
      hasMore,
    });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
