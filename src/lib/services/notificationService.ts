/**
 * Notification Service
 * Handles creating and managing notifications from the backend
 */

import { prisma } from "@/lib/db";
import { apiLogger } from "@/lib/utils/logger";
import type { NotificationType } from "@/types/notification";
import type { Prisma } from "@prisma/client";

export type { NotificationType };

export type CreateNotificationData = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
};

class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(
    data: CreateNotificationData,
  ): Promise<string | null> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || {},
          read: false,
        },
      });

      apiLogger.info("Notification created", {
        notificationId: notification.id,
        userId: data.userId,
        type: data.type,
        title: data.title,
      });

      return notification.id;
    } catch (error) {
      apiLogger.error("Failed to create notification", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: data.userId,
        type: data.type,
        title: data.title,
      });
      return null;
    }
  }

  /**
   * Create export started notification
   */
  async notifyExportStarted(
    userId: string,
    caseId: string,
    exportType: string,
    metadata?: Prisma.InputJsonObject,
  ): Promise<string | null> {
    return this.createNotification({
      userId,
      type: "EXPORT_STARTED",
      title: "Export Started",
      message: `Your ${exportType} export has started processing.`,
      data: {
        caseId,
        exportType,
        startedAt: new Date().toISOString(),
        ...metadata,
      },
    });
  }

  /**
   * Create export completed notification
   */
  async notifyExportCompleted(
    userId: string,
    caseId: string,
    exportType: string,
    metadata?: Prisma.InputJsonObject,
  ): Promise<string | null> {
    return this.createNotification({
      userId,
      type: "EXPORT_COMPLETED",
      title: "Export Completed",
      message: `Your ${exportType} export has been completed successfully.`,
      data: {
        caseId,
        exportType,
        completedAt: new Date().toISOString(),
        ...metadata,
      },
    });
  }

  /**
   * Create export failed notification
   */
  async notifyExportFailed(
    userId: string,
    caseId: string,
    exportType: string,
    error: string,
    metadata?: Prisma.InputJsonObject,
  ): Promise<string | null> {
    return this.createNotification({
      userId,
      type: "EXPORT_FAILED",
      title: "Export Failed",
      message: `Your ${exportType} export failed: ${error}`,
      data: {
        caseId,
        exportType,
        error,
        failedAt: new Date().toISOString(),
        ...metadata,
      },
    });
  }

  /**
   * Create document processed notification
   */
  async notifyDocumentProcessed(
    userId: string,
    documentId: string,
    documentName: string,
    caseId?: string,
    metadata?: Prisma.InputJsonObject,
  ): Promise<string | null> {
    return this.createNotification({
      userId,
      type: "DOCUMENT_PROCESSED",
      title: "Document Processed",
      message: `"${documentName}" has been processed and is ready for review.`,
      data: {
        documentId,
        documentName,
        caseId,
        processedAt: new Date().toISOString(),
        ...metadata,
      },
    });
  }

  /**
   * Create organization invitation notification
   */
  async notifyOrganizationInvitation(
    userId: string,
    organizationName: string,
    inviterName: string,
    token: string,
    metadata?: Prisma.InputJsonObject,
  ): Promise<string | null> {
    return this.createNotification({
      userId,
      type: "ORGANIZATION_INVITATION",
      title: "Organization Invitation",
      message: `${inviterName} has invited you to join ${organizationName}.`,
      data: {
        organizationName,
        inviterName,
        token,
        invitedAt: new Date().toISOString(),
        ...metadata,
      },
    });
  }

  /**
   * Create system alert notification
   */
  async notifySystemAlert(
    userId: string,
    title: string,
    message: string,
    severity: "info" | "warning" | "error" = "info",
    metadata?: Prisma.InputJsonObject,
  ): Promise<string | null> {
    return this.createNotification({
      userId,
      type: "SYSTEM_ALERT",
      title,
      message,
      data: {
        severity,
        alertedAt: new Date().toISOString(),
        ...metadata,
      },
    });
  }

  /**
   * Create lead captured notification
   */
  async notifyLeadCaptured(
    userId: string,
    leadId: string,
    leadName: string,
    leadEmail: string,
    chatbotId: string,
    chatbotName: string,
    source: "LEAD_FORM" | "BOOKING_FALLBACK",
    metadata?: Prisma.InputJsonObject,
  ): Promise<string | null> {
    const sourceDisplay =
      source === "LEAD_FORM" ? "Lead Form" : "Contact Capture";

    return this.createNotification({
      userId,
      type: "LEAD_CAPTURED",
      title: "New Lead Captured",
      message: `${leadName} (${leadEmail}) was captured via ${sourceDisplay} on ${chatbotName}`,
      data: {
        leadId,
        leadName,
        leadEmail,
        chatbotId,
        chatbotName,
        source,
        capturedAt: new Date().toISOString(),
        ...metadata,
      },
    });
  }

  /**
   * Create booking created notification
   */
  async notifyBookingCreated(
    userId: string,
    bookingId: string,
    contactName: string,
    contactEmail: string,
    appointmentDate: string,
    appointmentTime: string,
    chatbotId: string,
    chatbotName: string,
    categoryName: string,
    locationName: string,
    metadata?: Prisma.InputJsonObject,
  ): Promise<string | null> {
    return this.createNotification({
      userId,
      type: "BOOKING_CREATED",
      title: "New Booking Request",
      message: `${contactName} (${contactEmail}) booked an appointment for ${categoryName} at ${locationName} on ${appointmentDate} at ${appointmentTime}`,
      data: {
        bookingId,
        contactName,
        contactEmail,
        appointmentDate,
        appointmentTime,
        chatbotId,
        chatbotName,
        categoryName,
        locationName,
        createdAt: new Date().toISOString(),
        ...metadata,
      },
    });
  }

  /**
   * Create text request created notification
   */
  async notifyTextRequestCreated(
    userId: string,
    textRequestId: string,
    contactName: string,
    contactPhone: string,
    chatbotId: string,
    chatbotName: string,
    messagePreview: string,
    metadata?: Prisma.InputJsonObject,
  ): Promise<string | null> {
    return this.createNotification({
      userId,
      type: "TEXT_REQUEST_CREATED",
      title: "New Text Request",
      message: `${contactName} (${contactPhone}) sent a text request: "${messagePreview}"`,
      data: {
        textRequestId,
        contactName,
        contactPhone,
        chatbotId,
        chatbotName,
        messagePreview,
        createdAt: new Date().toISOString(),
        ...metadata,
      },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const updated = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId, // Ensure user can only mark their own notifications
        },
        data: {
          read: true,
        },
      });

      return updated.count > 0;
    } catch (error) {
      apiLogger.error("Failed to mark notification as read", {
        error: error instanceof Error ? error.message : "Unknown error",
        notificationId,
        userId,
      });
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          read: false,
        },
        data: {
          read: true,
        },
      });

      return true;
    } catch (error) {
      apiLogger.error("Failed to mark all notifications as read", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      });
      return false;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const deleted = await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId: userId, // Ensure user can only delete their own notifications
        },
      });

      return deleted.count > 0;
    } catch (error) {
      apiLogger.error("Failed to delete notification", {
        error: error instanceof Error ? error.message : "Unknown error",
        notificationId,
        userId,
      });
      return false;
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: {
          userId: userId,
          read: false,
        },
      });
    } catch (error) {
      apiLogger.error("Failed to get unread count", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      });
      return 0;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
