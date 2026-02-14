import { getServerSession } from "@/lib/auth/server-session";
import { getSession } from "@/lib/auth/session";
import { updateSessionActivity } from "@/lib/auth/sessionActivity";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_DURATION_MS } from "@/lib/auth/constants";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // First try getServerSession which handles both NextAuth and iron-session
    const serverSession = await getServerSession();

    if (serverSession) {
      // Update session activity in background
      updateSessionActivity();

      return NextResponse.json({
        success: true,
        user: serverSession.user,
        session: serverSession.session,
      });
    }

    // Fallback to iron-session directly for edge cases
    const session = await getSession();

    if (!session.userId) {
      // Clear stale OAuth cookies to prevent redirect loops
      // This happens when OAuth session is invalidated but JWT cookie persists
      const cookieStore = await cookies();
      const hasOAuthCookie =
        cookieStore.get("authjs.session-token") ||
        cookieStore.get("__Secure-authjs.session-token");
      if (hasOAuthCookie) {
        cookieStore.delete("authjs.session-token");
        cookieStore.delete("__Secure-authjs.session-token");
      }
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Try to get fresh user data with better error handling
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          mfaEnabled: true,
          canExport: true,
          isActive: true,
          isVerified: true,
          lastLoginAt: true,
          organizationRole: true,
          organization: {
            select: {
              id: true,
              name: true,
              subtitle: true,
              type: true,
              logoUrl: true,
              createdBy: true,
              createdAt: true,
            },
          },
        },
      });
    } catch (dbError: any) {
      console.error("Database connection error:", dbError);

      // If database is unavailable, return session data without fresh user data
      if (
        dbError.code === "P1001" ||
        dbError.message?.includes("Can't reach database")
      ) {
        return NextResponse.json({
          user: {
            id: session.userId,
            email: session.email,
            name: session.email.split("@")[0], // Fallback name
            mfaEnabled: false,
            mfaVerified: session.mfaVerified || false,
          },
          session: {
            id: session.sessionId,
            expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
          },
          warning:
            "Database temporarily unavailable. Using cached session data.",
        });
      }
      throw dbError;
    }

    if (!user || !user.isActive) {
      // Clear invalid session
      await session.destroy();
      return NextResponse.json({ error: "Session invalid" }, { status: 401 });
    }

    // Get actual session from database to calculate accurate expiration
    let dbSession = null;
    let expiresAt: Date;
    try {
      dbSession = await prisma.session.findUnique({
        where: { id: session.sessionId },
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          isActive: true,
        },
      });

      if (!dbSession || !dbSession.isActive) {
        await session.destroy();
        await prisma.session.updateMany({
          where: { id: session.sessionId },
          data: { isActive: false },
        });
        return NextResponse.json({ error: "Session invalid" }, { status: 401 });
      }

      // Calculate expiration based on actual session creation time
      expiresAt = new Date(dbSession.createdAt.getTime() + SESSION_DURATION_MS);

      // Check if session is expired
      if (expiresAt < new Date()) {
        await session.destroy();
        await prisma.session.update({
          where: { id: dbSession.id },
          data: { isActive: false },
        });
        return NextResponse.json({ error: "Session expired" }, { status: 401 });
      }
    } catch (dbError: any) {
      // If we can't get session from DB, use fallback calculation
      console.error("Error getting session from database:", dbError);
      expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    }

    // Update session activity in background
    updateSessionActivity();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        mfaEnabled: user.mfaEnabled,
        mfaVerified: session.mfaVerified,
        hasPassword: !!user.password,
        canExport: user.canExport,
        organizationRole: user.organizationRole || undefined,
        organization: user.organization || undefined,
      },
      session: {
        id: session.sessionId,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    );
  }
}
