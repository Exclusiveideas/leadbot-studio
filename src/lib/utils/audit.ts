import { prisma } from "@/lib/db";
import { activityEvents } from "@/lib/events/activityEvents";
import { NextRequest } from "next/server";
import {
  AuditEventMetadata,
  AuthEvents,
  getEventCategory,
  getEventSeverity,
} from "./audit-types";

export interface AuditLogParams {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  request?: NextRequest;
  metadata?: AuditEventMetadata;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

export async function createAuditLog({
  userId,
  action,
  resource,
  resourceId,
  details,
  severity = "INFO",
  request,
  metadata,
  oldValues,
  newValues,
}: AuditLogParams) {
  let ipAddress: string | undefined;
  let userAgent: string | undefined;
  let endpoint: string | undefined;

  if (request) {
    ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;
    userAgent = request.headers.get("user-agent") || undefined;
    endpoint = request.url;
  }

  // Combine details with metadata
  const combinedDetails = {
    ...details,
    ...metadata,
  };

  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        ipAddress,
        userAgent,
        endpoint,
        details: combinedDetails ? JSON.stringify(combinedDetails) : undefined,
        oldValues: oldValues ? JSON.stringify(oldValues) : undefined,
        newValues: newValues ? JSON.stringify(newValues) : undefined,
        severity,
      },
    });

    // Emit activity event for real-time updates
    // Only emit for user-initiated actions (not system actions)
    if (userId && typeof window === "undefined") {
      // Server-side: we can't emit browser events
      // In the future, this could emit to a WebSocket server
    } else if (userId && typeof window !== "undefined") {
      // Client-side: emit browser event
      emitActivityEventFromAudit({
        userId,
        action,
        resource,
        resourceId,
        details: combinedDetails,
        severity,
      });
    }

    return auditLog;
  } catch (error) {
    // Log to console but don't throw - audit logging should not break the app
    console.error("Failed to create audit log:", error);
    return null;
  }
}

/**
 * Async audit logging helper - fires and forgets to avoid blocking requests
 * Errors are logged but don't throw to prevent audit failures from breaking the app
 */
export function logAuditAsync(params: AuditLogParams): void {
  createAuditLog(params).catch((err) => {
    console.error("[Audit] Log failed (non-blocking):", err);
  });
}

// Re-export auth event type for backward compatibility
export type AuthEventType = (typeof AuthEvents)[keyof typeof AuthEvents];

// Re-export commonly used types
export type { AuditEventMetadata, AuditEventType } from "./audit-types";

export async function logAuthEvent(
  action: AuthEventType,
  userId?: string,
  details?: Record<string, any>,
  request?: NextRequest,
  metadata?: AuditEventMetadata,
) {
  const severity = getEventSeverity(action);
  const category = getEventCategory(action);

  await createAuditLog({
    userId,
    action,
    resource: category,
    details,
    severity,
    request,
    metadata,
  });
}

// Helper function to emit activity events from audit logs
function emitActivityEventFromAudit(params: {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  severity: string;
}) {
  const { action, resource, resourceId, details } = params;

  // Map audit log actions to activity event types
  const eventTypeMap: Record<string, string> = {
    CREATE_DOCUMENT: "document:upload",
    UPLOAD_DOCUMENT: "document:upload",
    DOWNLOAD_DOCUMENT: "document:download",
    VIEW_DOCUMENT: "document:view",
    DELETE_DOCUMENT: "document:delete",
    REPROCESS_DOCUMENT: "document:reprocess",
    CREATE_CASE: "case:create",
    UPDATE_CASE: "case:update",
    DELETE_CASE: "case:delete",
    ARCHIVE_CASE: "case:archive",
    LOGIN: "auth:login",
    LOGOUT: "auth:logout",
    SETUP_MFA: "auth:mfa_setup",
    ASSIGN_PERMISSION: "permission:assign",
    REVOKE_PERMISSION: "permission:revoke",
    CREATE_FILTER: "filter:save",
    DELETE_FILTER: "filter:delete",
    CREATE_SAMPLE_DATA: "system:sample_data",
  };

  // Determine event type
  const actionKey = `${action}_${resource}`.toUpperCase();
  const eventType =
    eventTypeMap[actionKey] || eventTypeMap[action] || "audit:activity";

  // Emit the event
  activityEvents.emit(eventType as any, {
    action,
    resource,
    resourceId,
    description:
      details?.filename || details?.caseNumber || details?.description,
    metadata: details,
  });
}
