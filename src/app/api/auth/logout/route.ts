import { NextRequest, NextResponse } from "next/server";
import { getSession, destroySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { logAuthEvent } from "@/lib/utils/audit";
import { sessionCache } from "@/lib/auth/sessionCache";

export async function POST(request: NextRequest) {
  try {
    let userId: string | undefined;
    let sessionId: string | undefined;

    const ironSession = await getSession();
    if (ironSession.userId && ironSession.sessionId) {
      userId = ironSession.userId;
      sessionId = ironSession.sessionId;
    }

    // Invalidate session in database and cache
    if (sessionId) {
      try {
        await prisma.session.update({
          where: { id: sessionId },
          data: { isActive: false },
        });
        await sessionCache.setAsync(sessionId, false);
      } catch {
        // Session may not exist, continue with logout
      }
    }

    // Log logout event
    if (userId) {
      await logAuthEvent("LOGOUT", userId, undefined, request);
    }

    // Destroy iron-session cookie
    await destroySession();

    return NextResponse.json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    try {
      await destroySession();
    } catch {}

    return NextResponse.json({
      message: "Logged out",
    });
  }
}
