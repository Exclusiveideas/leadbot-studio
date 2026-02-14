import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

interface SessionData {
  userId: string;
  email: string;
  sessionId: string;
  mfaVerified: boolean;
}

const SESSION_OPTIONS = {
  password:
    process.env.SESSION_PASSWORD ||
    "complex-password-at-least-32-characters-long",
  cookieName: "leadbotstudio-session",
};

// Routes that require authentication
const PROTECTED_PREFIXES = ["/chatbots", "/settings", "/onboarding"];

// Routes that authenticated users should be redirected away from
const PUBLIC_ONLY_ROUTES = ["/login", "/signup", "/reset-password"];

// Routes that skip middleware entirely
const SKIP_PREFIXES = [
  "/_next",
  "/api",
  "/favicon.ico",
  "/chatbot",
  "/widget",
];

export async function authMiddleware(
  request: NextRequest,
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip middleware for certain routes
  if (
    SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Try to get session
  const response = NextResponse.next();
  let isAuthenticated = false;

  try {
    const session = await getIronSession<SessionData>(
      request,
      response,
      SESSION_OPTIONS,
    );
    isAuthenticated = !!session.userId;
  } catch {
    // Session check failed, treat as unauthenticated
  }

  // Redirect authenticated users away from public-only routes
  if (isAuthenticated && PUBLIC_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/chatbots", request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (
    !isAuthenticated &&
    PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
