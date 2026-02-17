import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { cache } from "react";
import { prisma } from "@/lib/db";
import type { ServerSessionData } from "@/types/session";

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days
const SESSION_DURATION_MS = SESSION_DURATION_SECONDS * 1000;

interface IronSessionData {
  userId?: string;
  email?: string;
  sessionId?: string;
  mfaVerified?: boolean;
  destroy(): void;
}

// Server-only function to get session data (cached per request)
export const getServerSession = cache(
  async (): Promise<ServerSessionData | null> => {
    try {
      const cookieStore = await cookies();

      const session = await getIronSession<IronSessionData>(cookieStore, {
        password: process.env.SESSION_PASSWORD!,
        cookieName: "leadbotstudio-session",
        cookieOptions: {
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: SESSION_DURATION_SECONDS,
        },
      });

      if (!session.userId) {
        return null;
      }

      // Fetch fresh user data
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
                plan: true,
              },
            },
          },
        });
      } catch (dbError: any) {
        console.error("Database connection error in server session:", dbError);

        if (
          dbError.code === "P1001" ||
          dbError.message?.includes("Can't reach database")
        ) {
          return null;
        }
        throw dbError;
      }

      if (!user || !user.isActive) {
        return null;
      }

      // Get actual session from database to calculate accurate expiration
      let expiresAt: Date;
      try {
        const dbSession = await prisma.session.findUnique({
          where: { id: session.sessionId || "" },
          select: {
            id: true,
            createdAt: true,
            isActive: true,
          },
        });

        if (!dbSession || !dbSession.isActive) {
          return null;
        }

        expiresAt = new Date(
          dbSession.createdAt.getTime() + SESSION_DURATION_MS,
        );

        if (expiresAt < new Date()) {
          return null;
        }
      } catch (error) {
        expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          mfaEnabled: user.mfaEnabled,
          mfaVerified: session.mfaVerified || false,
          hasPassword: !!user.password,
          organizationRole: (user.organizationRole as "OWNER" | "MEMBER") || "MEMBER",
          organization: user.organization
            ? {
                ...user.organization,
                createdAt: user.organization.createdAt?.toISOString(),
              }
            : { id: "", name: "" },
        },
        session: {
          id: session.sessionId || "",
          expiresAt: expiresAt.toISOString(),
        },
      };
    } catch (error) {
      console.error("Server session check error:", error);
      return null;
    }
  },
);

// Helper to check if user is authenticated server-side
export async function requireAuth(): Promise<ServerSessionData> {
  const sessionData = await getServerSession();

  if (!sessionData) {
    throw new Error("Authentication required");
  }

  return sessionData;
}

// Helper to check if user has organization admin access
export async function requireOrgAdmin(): Promise<ServerSessionData> {
  const sessionData = await requireAuth();

  if (!sessionData.user.organization) {
    throw new Error("Organization membership required");
  }

  const userRole = sessionData.user.organizationRole;
  if (userRole !== "OWNER") {
    throw new Error("Organization owner access required");
  }

  return sessionData;
}
