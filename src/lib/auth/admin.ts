/**
 * Admin authentication utilities
 * Provides functions to check admin access based on environment-configured admin emails
 */

import { getServerSession } from "./server-session";

/**
 * Get list of admin emails from environment variable
 * Format: ADMIN_EMAILS="email1@example.com,email2@example.com"
 */
export function getAdminEmails(): string[] {
  const adminEmailsEnv = process.env.ADMIN_EMAILS || "";
  return adminEmailsEnv
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

/**
 * Check if an email is in the admin list
 */
export function isAdmin(email: string): boolean {
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase());
}

/**
 * Server-side middleware to require admin access
 * Throws error if user is not authenticated or not an admin
 */
export async function requireAdmin() {
  const session = await getServerSession();

  if (!session) {
    throw new Error("Authentication required");
  }

  if (!isAdmin(session.user.email)) {
    throw new Error("Admin access required");
  }

  return session;
}

/**
 * Check if current user is admin (server-side)
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const session = await getServerSession();
    if (!session) return false;
    return isAdmin(session.user.email);
  } catch {
    return false;
  }
}
