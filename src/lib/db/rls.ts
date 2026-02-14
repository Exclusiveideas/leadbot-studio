import { Prisma, type PrismaClient } from "@prisma/client";

/**
 * RLS (Row-Level Security) context for Postgres
 *
 * This module provides utilities to set the current user context in Postgres
 * session variables, which are then used by RLS policies to enforce data access control.
 *
 * How it works:
 * 1. Before each query, we set `app.current_user_id` session variable
 * 2. RLS policies reference this variable to filter data
 * 3. Each request gets its own database connection with its own session variables
 *
 * Example RLS policy:
 * ```sql
 * CREATE POLICY "users_own_data" ON some_table
 *   FOR SELECT USING (user_id = current_setting('app.current_user_id', true)::text);
 * ```
 */

export interface RLSContext {
  userId: string;
  organizationId?: string;
  organizationRole?: string;
  isGlobalAdmin?: boolean;
}

/**
 * Sets the current user context in Postgres session variables
 *
 * This sets connection-level session variables that persist for the entire connection.
 * RLS policies can reference these variables to enforce data access control.
 *
 * Connection-scoped (false parameter) is used to avoid transaction timeout issues
 * while still maintaining RLS security. Prisma's connection pooling will handle
 * resetting these on connection reuse.
 */
export async function setRLSContext(
  prisma: PrismaClient,
  context: RLSContext,
): Promise<void> {
  // Set all session variables in a single query (connection-scoped for performance)
  await prisma.$executeRaw`
    SELECT
      set_config('app.current_user_id', ${context.userId}, false),
      set_config('app.current_organization_id', ${context.organizationId || null}, false),
      set_config('app.current_user_role', ${context.organizationRole || null}, false),
      set_config('app.is_global_admin', ${context.isGlobalAdmin ? "true" : "false"}, false)
  `;
}

/**
 * Clears the RLS context (useful for testing)
 */
export async function clearRLSContext(prisma: PrismaClient): Promise<void> {
  // Clear all session variables in a single query
  await prisma.$executeRaw`
    SELECT
      set_config('app.current_user_id', NULL, false),
      set_config('app.current_organization_id', NULL, false),
      set_config('app.current_user_role', NULL, false),
      set_config('app.is_global_admin', NULL, false)
  `;
}

/**
 * Executes a callback within an RLS context using a transaction
 *
 * This ensures the RLS context is set and maintained for all queries
 * within the callback. This is the RECOMMENDED way to use RLS with Prisma
 * as it handles connection pooling correctly.
 *
 * Usage:
 * ```typescript
 * const logs = await withRLSTransaction(prisma, rlsContext, async (tx) => {
 *   return await tx.auditLog.findMany();
 * });
 * ```
 *
 * For long-running operations, specify a custom timeout:
 * ```typescript
 * const dashboardData = await withRLSTransaction(
 *   prisma,
 *   rlsContext,
 *   async (tx) => {
 *     // Complex dashboard queries...
 *   },
 *   { timeout: 15000 } // 15 seconds
 * );
 * ```
 */
export async function withRLSTransaction<T>(
  prisma: PrismaClient,
  context: RLSContext,
  callback: (tx: any) => Promise<T>,
  options?: {
    /**
     * Maximum time (in milliseconds) the transaction can run before timing out.
     * Default: 5000ms (5 seconds)
     */
    timeout?: number;
    /**
     * Maximum time (in milliseconds) to wait to acquire a connection.
     * Default: 2000ms (2 seconds)
     */
    maxWait?: number;
  },
): Promise<T> {
  return await prisma.$transaction(
    async (tx) => {
      // Set RLS context at the start of the transaction
      await tx.$executeRaw`
        SELECT
          set_config('app.current_user_id', ${context.userId}, true),
          set_config('app.current_organization_id', ${context.organizationId || null}, true),
          set_config('app.current_user_role', ${context.organizationRole || null}, true),
          set_config('app.is_global_admin', ${context.isGlobalAdmin ? "true" : "false"}, true)
      `;

      // Execute the callback with the transaction client
      return await callback(tx);
    },
    {
      maxWait: options?.maxWait ?? 2000,
      timeout: options?.timeout ?? 5000,
    },
  );
}

/**
 * Creates an RLS-aware Prisma client extension
 *
 * WARNING: This may not work reliably with connection pooling.
 * Use withRLSTransaction() instead for guaranteed RLS enforcement.
 *
 * Usage:
 * ```typescript
 * const session = await getServerSession();
 * const rlsPrisma = prisma.$extends(withRLS({ userId: session.user.id }));
 * const cases = await rlsPrisma.case.findMany(); // RLS automatically enforced
 * ```
 */
export function withRLS(context: RLSContext) {
  return Prisma.defineExtension((client) =>
    client.$extends({
      query: {
        async $allOperations({ operation, model, args, query }) {
          // Set RLS context before the query
          await setRLSContext(client as PrismaClient, context);

          // Execute the query
          return query(args);
        },
      },
    }),
  );
}

/**
 * Helper to get RLS context from server session
 *
 * Usage:
 * ```typescript
 * import { getServerSession } from "@/lib/auth/server-session";
 * import { getRLSContextFromSession } from "@/lib/db/rls";
 *
 * const session = await getServerSession();
 * const rlsContext = getRLSContextFromSession(session, adminEmails);
 * ```
 */
export function getRLSContextFromSession(
  session: {
    user: {
      id: string;
      email: string;
      organizationRole?: string;
      organization?: { id: string };
    };
  },
  adminEmails: string[] = [],
): RLSContext {
  return {
    userId: session.user.id,
    organizationId: session.user.organization?.id,
    organizationRole: session.user.organizationRole,
    isGlobalAdmin: adminEmails.includes(session.user.email.toLowerCase()),
  };
}
