import { getSession } from "@/lib/auth/session";
import { notificationService } from "@/lib/services/notificationService";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId } = body as { notificationId?: string };

    if (notificationId) {
      const success = await notificationService.markAsRead(
        notificationId,
        session.userId,
      );
      if (!success) {
        return NextResponse.json(
          { error: "Notification not found" },
          { status: 404 },
        );
      }
    } else {
      await notificationService.markAllAsRead(session.userId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
