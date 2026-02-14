import { prisma } from "@/lib/db";
import { getSession } from "./session";

/**
 * Update session activity timestamp
 * Call this on important user actions to track real activity
 */
export async function updateSessionActivity(): Promise<void> {
  try {
    const session = await getSession();

    if (session?.sessionId) {
      await prisma.session.updateMany({
        where: {
          id: session.sessionId,
          isActive: true,
        },
        data: {
          updatedAt: new Date(),
        },
      });
    }
  } catch (error) {
    // Fail silently - session tracking shouldn't break the app
    console.error("Failed to update session activity:", error);
  }
}

/**
 * Middleware-style function to automatically update session activity
 * Use this in API routes that should count as "user activity"
 */
export async function withSessionActivity<T>(
  handler: () => Promise<T>,
): Promise<T> {
  // Update session activity in background
  updateSessionActivity();

  // Execute the main handler
  return handler();
}

/**
 * Get online users with better activity tracking
 * This function can be used instead of direct prisma queries
 */
export async function getOnlineUsersCount(
  activityWindowMinutes: number = 30,
): Promise<number> {
  const cutoff = new Date(Date.now() - activityWindowMinutes * 60 * 1000);

  return await prisma.session.count({
    where: {
      isActive: true,
      expiresAt: {
        gt: new Date(),
      },
      updatedAt: {
        gte: cutoff,
      },
    },
  });
}
