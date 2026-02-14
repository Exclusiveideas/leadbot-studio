/**
 * Lead Notification Service
 * Orchestrates sending notifications when leads are captured
 */

import { prisma } from "@/lib/db";
import { notificationService } from "./notificationService";
import { sendLeadCaptureNotificationEmail } from "@/lib/email/resend";

type LeadSource = "LEAD_FORM" | "BOOKING_FALLBACK";

type LeadNotificationData = {
  chatbot: {
    id: string;
    name: string;
    createdBy: string;
    organizationId: string | null;
  };
  lead: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  source: LeadSource;
};

type Recipient = {
  id: string;
  email: string;
  name: string | null;
};

/**
 * Send notifications to chatbot creator and organization admins when a lead is captured.
 * This is a fire-and-forget function - errors are logged but not thrown.
 */
export async function notifyLeadCapture(
  data: LeadNotificationData,
): Promise<void> {
  const { chatbot, lead, source } = data;

  try {
    // Collect all unique recipient IDs
    const recipientIds = new Set<string>();

    // Always add creator
    recipientIds.add(chatbot.createdBy);

    // Get organization admins if chatbot has organizationId
    let orgAdmins: Recipient[] = [];

    if (chatbot.organizationId) {
      orgAdmins = await prisma.user.findMany({
        where: {
          organizationId: chatbot.organizationId,
          OR: [{ organizationRole: "creator" }, { organizationRole: "admin" }],
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      // Add org admins to recipient set (deduplication happens via Set)
      orgAdmins.forEach((admin) => recipientIds.add(admin.id));
    }

    // Get creator info
    const creator = await prisma.user.findUnique({
      where: { id: chatbot.createdBy },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!creator) {
      console.error(
        `[LeadNotification] Creator not found: ${chatbot.createdBy}`,
      );
      return;
    }

    // Combine all recipients (deduplicated)
    const allRecipients: Recipient[] = [
      creator,
      ...orgAdmins.filter((a) => a.id !== creator.id),
    ];

    // Create in-platform notifications for all recipients
    const notificationPromises = allRecipients.map((recipient) =>
      notificationService
        .notifyLeadCaptured(
          recipient.id,
          lead.id,
          lead.name,
          lead.email,
          chatbot.id,
          chatbot.name,
          source,
        )
        .catch((err) => {
          console.error(
            `[LeadNotification] Failed to create notification for ${recipient.id}:`,
            err,
          );
        }),
    );

    // Send email notifications to all recipients
    const emailPromises = allRecipients.map((recipient) =>
      sendLeadCaptureNotificationEmail(
        recipient.email,
        recipient.name || recipient.email,
        lead.name,
        lead.email,
        chatbot.name,
        chatbot.id,
        source,
        lead.phone || undefined,
      ).catch((err) => {
        console.error(
          `[LeadNotification] Failed to send email to ${recipient.email}:`,
          err,
        );
      }),
    );

    // Execute all in parallel
    await Promise.allSettled([...notificationPromises, ...emailPromises]);
  } catch (error) {
    console.error("[LeadNotification] Failed to send notifications:", error);
  }
}
