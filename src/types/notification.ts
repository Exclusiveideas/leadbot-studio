/**
 * Notification Types
 * Centralized type definitions for the notification system
 */

import type { Brand } from "./branded";

/**
 * Branded type for notification IDs
 */
export type NotificationId = Brand<string, "NotificationId">;

/**
 * Convert a string to a NotificationId
 */
export function toNotificationId(id: string): NotificationId {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid notification ID: must be a non-empty string");
  }
  return id as NotificationId;
}

/**
 * Notification types matching the Prisma NotificationType enum
 */
export type NotificationType =
  | "ORGANIZATION_INVITATION"
  | "INVITATION_ACCEPTED"
  | "INVITATION_DECLINED"
  | "EXPORT_COMPLETED"
  | "EXPORT_STARTED"
  | "EXPORT_FAILED"
  | "DOCUMENT_PROCESSED"
  | "CASE_UPDATED"
  | "SYSTEM_ALERT"
  | "LEAD_CAPTURED"
  | "BOOKING_CREATED"
  | "TEXT_REQUEST_CREATED"
  | "CONVERSATION_LIMIT_REACHED"
  | "SUBSCRIPTION_EXPIRED";

/**
 * Toast-only notification types (not persisted to database)
 */
export type ToastOnlyType = "SUCCESS" | "ERROR" | "INFO";

/**
 * All notification types including toast-only types
 */
export type AllNotificationTypes = NotificationType | ToastOnlyType;

/**
 * Type-safe notification data payloads
 */
export type NotificationData = {
  ORGANIZATION_INVITATION: {
    organizationName: string;
    inviterName: string;
    token: string;
    invitedAt: string;
  };
  INVITATION_ACCEPTED: {
    organizationName: string;
    memberName: string;
    acceptedAt: string;
  };
  INVITATION_DECLINED: {
    organizationName: string;
    memberName: string;
    declinedAt: string;
  };
  EXPORT_STARTED: {
    caseId: string;
    exportType: string;
    startedAt: string;
  };
  EXPORT_COMPLETED: {
    caseId: string;
    exportType: string;
    completedAt: string;
  };
  EXPORT_FAILED: {
    caseId: string;
    exportType: string;
    error: string;
    failedAt: string;
  };
  DOCUMENT_PROCESSED: {
    documentId: string;
    documentName: string;
    caseId?: string;
    processedAt: string;
  };
  CASE_UPDATED: {
    caseId: string;
    caseName: string;
    updatedAt: string;
  };
  SYSTEM_ALERT: {
    severity: "info" | "warning" | "error";
    alertedAt: string;
  };
  LEAD_CAPTURED: {
    leadId: string;
    leadName: string;
    leadEmail: string;
    chatbotId: string;
    chatbotName: string;
    source: "LEAD_FORM" | "BOOKING_FALLBACK";
    capturedAt: string;
  };
  BOOKING_CREATED: {
    bookingId: string;
    contactName: string;
    contactEmail: string;
    appointmentDate: string;
    appointmentTime: string;
    chatbotId: string;
    chatbotName: string;
    categoryName: string;
    locationName: string;
    createdAt: string;
  };
  TEXT_REQUEST_CREATED: {
    textRequestId: string;
    contactName: string;
    contactPhone: string;
    chatbotId: string;
    chatbotName: string;
    messagePreview: string;
    createdAt: string;
  };
  CONVERSATION_LIMIT_REACHED: {
    chatbotId: string;
    chatbotName: string;
    currentCount: number;
    limit: number;
    reachedAt: string;
  };
  SUBSCRIPTION_EXPIRED: {
    unpublishedCount: number;
    expiredAt: string;
  };
};

/**
 * Base notification interface
 */
export type Notification<T extends NotificationType = NotificationType> = {
  id: string;
  userId: string;
  type: T;
  title: string;
  message: string;
  data: T extends keyof NotificationData
    ? NotificationData[T] & Record<string, unknown>
    : Record<string, unknown>;
  read: boolean;
  createdAt: string;
};

/**
 * Simplified notification for client-side use (without userId)
 */
export type ClientNotification = Omit<Notification, "userId">;

/**
 * Notification update event from real-time subscription
 */
export type NotificationUpdateType = "INSERT" | "UPDATE" | "DELETE";

export type NotificationUpdate = {
  type: NotificationUpdateType;
  notification: Notification;
};

export type NotificationCallback = (update: NotificationUpdate) => void;

/**
 * API response types
 */
export type GetNotificationsResponse = {
  success: true;
  notifications: ClientNotification[];
  unreadCount: number;
  hasMore: boolean;
};
