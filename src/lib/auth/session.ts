import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionData {
  userId: string;
  email: string;
  sessionId: string;
  mfaVerified: boolean;
  createdAt?: number;
  organization?: {
    id: string;
    name: string;
    subtitle?: string;
    type?: string;
    logoUrl?: string;
  };
}

const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_PASSWORD ||
    "complex-password-at-least-32-characters-long",
  cookieName: "leadbotstudio-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_DURATION_SECONDS,
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions,
  );

  return session;
}

export async function getSessionFromRequest(
  req: NextRequest,
  res: NextResponse,
): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(req, res, sessionOptions);
}

export async function createSession(data: SessionData): Promise<void> {
  const session = await getSession();

  session.userId = data.userId;
  session.email = data.email;
  session.sessionId = data.sessionId;
  session.mfaVerified = data.mfaVerified;
  session.organization = data.organization;

  await session.save();
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  await session.destroy();
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();

  if (!session.userId) {
    throw new Error("Unauthorized");
  }

  return {
    userId: session.userId,
    email: session.email,
    sessionId: session.sessionId,
    mfaVerified: session.mfaVerified,
  };
}

export async function requireMFA(): Promise<SessionData> {
  const sessionData = await requireAuth();

  if (!sessionData.mfaVerified) {
    throw new Error("MFA verification required");
  }

  return sessionData;
}

// RBAC functions removed - system now uses organizationRole field
