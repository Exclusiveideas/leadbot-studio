import { NextRequest, NextResponse } from "next/server";
import { type PrismaClient } from "@prisma/client";
import { getServerSession } from "@/lib/auth/server-session";
import { getAdminEmails } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import {
  setRLSContext,
  getRLSContextFromSession,
  type RLSContext,
} from "@/lib/db/rls";
import { sessionCache } from "@/lib/auth/sessionCache";

/**
 * RLS-aware API route handler
 *
 * This type represents an API route handler that receives:
 * 1. The Next.js request object
 * 2. The user session (guaranteed to be present)
 * 3. The RLS context for the current user
 * 4. The Prisma client with RLS context already set (connection-scoped)
 * 5. The route context (contains params for dynamic routes)
 */
type RLSRouteHandler<T = any> = (
  request: NextRequest,
  session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>,
  rlsContext: RLSContext,
  prisma: PrismaClient,
  context?: any,
) => Promise<NextResponse<T>>;

/**
 * Wraps an API route handler with automatic RLS context management
 *
 * This wrapper:
 * 1. Checks authentication (returns 401 if not authenticated)
 * 2. Extracts RLS context from the session
 * 3. Sets RLS context at connection level (no transaction, avoids timeouts)
 * 4. Calls your handler with the Prisma client
 * 5. Logs RLS context adoption metrics
 *
 * Usage:
 * ```typescript
 * export const GET = withRLS(async (request, session, rlsContext, prisma) => {
 *   // All queries using 'prisma' will have RLS context set
 *   const cases = await prisma.case.findMany({
 *     where: { userId: session.user.id }
 *   });
 *
 *   return NextResponse.json({ data: cases });
 * });
 * ```
 *
 * @param handler - Your API route handler function
 * @param options - Optional configuration
 * @returns A wrapped Next.js route handler with RLS enabled
 */
export function withRLS<T = any>(
  handler: RLSRouteHandler<T>,
  options: {
    /**
     * Custom admin emails list (defaults to getAdminEmails())
     */
    adminEmails?: string[];
    /**
     * Route name for logging (defaults to 'unknown')
     */
    routeName?: string;
  } = {},
) {
  return async (
    request: NextRequest,
    context?: any,
  ): Promise<NextResponse<T>> => {
    const routeName = options.routeName || "unknown";

    try {
      // 1. Check authentication
      const session = await getServerSession();
      if (!session) {
        logRLSMetric(routeName, "unauthenticated");
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 },
        ) as NextResponse<T>;
      }

      // 1.5. Check if session has been invalidated (distributed check via Valkey)
      if (session.session?.id) {
        const isInvalidated = await sessionCache.isInvalidated(
          session.session.id,
        );
        if (isInvalidated) {
          logRLSMetric(routeName, "unauthenticated", {
            reason: "session_invalidated",
          });
          return NextResponse.json(
            { error: "Session has been invalidated" },
            { status: 401 },
          ) as NextResponse<T>;
        }
      }

      // 2. Get RLS context from session
      const adminEmails = options.adminEmails || getAdminEmails();
      const rlsContext = getRLSContextFromSession(session, adminEmails);

      // 3. Set RLS context at connection level (no transaction to avoid timeouts)
      await setRLSContext(prisma, rlsContext);

      // 4. Log RLS adoption metric
      logRLSMetric(routeName, "context_set_connection_scoped", {
        userId: rlsContext.userId,
        organizationId: rlsContext.organizationId,
        isGlobalAdmin: rlsContext.isGlobalAdmin,
      });

      // 5. Execute handler with Prisma client (RLS context already set)
      return await handler(request, session, rlsContext, prisma, context);
    } catch (error) {
      console.error(`[RLS Error] Route: ${routeName}`, error);
      logRLSMetric(routeName, "error", { error: String(error) });

      return NextResponse.json(
        {
          error: "Internal server error",
          details:
            process.env.NODE_ENV === "development" ? String(error) : undefined,
        },
        { status: 500 },
      ) as NextResponse<T>;
    }
  };
}

/**
 * Alternative wrapper for API routes that need direct Prisma access
 * (same as withRLS now, kept for backward compatibility)
 *
 * This is now identical to withRLS since we no longer use transactions.
 * Both set connection-level RLS context and provide the Prisma client.
 *
 * Usage:
 * ```typescript
 * export const GET = withRLSContext(async (request, session, rlsContext) => {
 *   // Use prisma directly (RLS context already set)
 *   const cases = await prisma.case.findMany({
 *     where: { userId: session.user.id }
 *   });
 *
 *   return NextResponse.json({ data: cases });
 * });
 * ```
 */
export function withRLSContext<T = any>(
  handler: (
    request: NextRequest,
    session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>,
    rlsContext: RLSContext,
  ) => Promise<NextResponse<T>>,
  options: {
    adminEmails?: string[];
    routeName?: string;
  } = {},
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    const routeName = options.routeName || "unknown";

    try {
      // 1. Check authentication
      const session = await getServerSession();
      if (!session) {
        logRLSMetric(routeName, "unauthenticated");
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 },
        ) as NextResponse<T>;
      }

      // 1.5. Check if session has been invalidated (distributed check via Valkey)
      if (session.session?.id) {
        const isInvalidated = await sessionCache.isInvalidated(
          session.session.id,
        );
        if (isInvalidated) {
          logRLSMetric(routeName, "unauthenticated", {
            reason: "session_invalidated",
          });
          return NextResponse.json(
            { error: "Session has been invalidated" },
            { status: 401 },
          ) as NextResponse<T>;
        }
      }

      // 2. Get and set RLS context
      const adminEmails = options.adminEmails || getAdminEmails();
      const rlsContext = getRLSContextFromSession(session, adminEmails);

      // 3. Set RLS context at connection level
      await setRLSContext(prisma, rlsContext);

      // 4. Log RLS adoption metric
      logRLSMetric(routeName, "context_set_connection_scoped", {
        userId: rlsContext.userId,
        organizationId: rlsContext.organizationId,
        isGlobalAdmin: rlsContext.isGlobalAdmin,
      });

      // 5. Execute handler
      return await handler(request, session, rlsContext);
    } catch (error) {
      console.error(`[RLS Error] Route: ${routeName}`, error);
      logRLSMetric(routeName, "error", { error: String(error) });

      return NextResponse.json(
        {
          error: "Internal server error",
          details:
            process.env.NODE_ENV === "development" ? String(error) : undefined,
        },
        { status: 500 },
      ) as NextResponse<T>;
    }
  };
}

/**
 * Logs RLS metrics for monitoring and adoption tracking
 */
function logRLSMetric(
  routeName: string,
  status:
    | "context_set"
    | "context_set_connection_scoped"
    | "context_set_non_transaction"
    | "unauthenticated"
    | "error"
    | "missing",
  metadata?: Record<string, any>,
) {
  const timestamp = new Date().toISOString();

  // Structured logging for easy parsing by log aggregators
  const logEntry = {
    timestamp,
    type: "rls_metric",
    routeName,
    status,
    ...metadata,
  };

  // Log at appropriate level
  if (status === "error") {
    console.error("[RLS Metrics]", JSON.stringify(logEntry));
  } else if (status === "missing") {
    console.warn("[RLS Metrics]", JSON.stringify(logEntry));
  } else if (status === "context_set_non_transaction") {
    console.warn("[RLS Metrics]", JSON.stringify(logEntry));
  } else {
    console.log("[RLS Metrics]", JSON.stringify(logEntry));
  }

  // TODO: Send metrics to monitoring service (Datadog, CloudWatch, etc.)
  // Example:
  // sendMetric('rls.context.set', 1, { route: routeName, status });
}

/**
 * Tracks which API routes have RLS enabled
 *
 * Call this at the start of any API route that doesn't use withRLS wrapper
 * to track adoption metrics.
 */
export function trackRLSAdoption(routeName: string, hasRLS: boolean) {
  logRLSMetric(routeName, hasRLS ? "context_set" : "missing", {
    manual_tracking: true,
  });
}
