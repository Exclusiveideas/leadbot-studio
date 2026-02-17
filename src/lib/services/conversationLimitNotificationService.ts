/**
 * Conversation Limit Notification Service
 * Orchestrates sending notifications when a chatbot reaches its monthly conversation limit
 */

import { prisma } from "@/lib/db";
import { notificationService } from "./notificationService";
import { sendConversationLimitEmail } from "@/lib/email/resend";

type ConversationLimitNotificationData = {
  chatbot: {
    id: string;
    name: string;
    createdBy: string;
    organizationId: string | null;
  };
  currentCount: number;
  limit: number;
};

type Recipient = {
  id: string;
  email: string;
  name: string | null;
};

/**
 * Send notifications to chatbot creator and organization admins when conversation limit is reached.
 * This is a fire-and-forget function - errors are logged but not thrown.
 */
export async function notifyConversationLimitReached(
  data: ConversationLimitNotificationData,
): Promise<void> {
  const { chatbot, currentCount, limit } = data;

  try {
    const recipientIds = new Set<string>();
    recipientIds.add(chatbot.createdBy);

    let orgAdmins: Recipient[] = [];

    if (chatbot.organizationId) {
      orgAdmins = await prisma.user.findMany({
        where: {
          organizationId: chatbot.organizationId,
          organizationRole: "OWNER",
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      orgAdmins.forEach((admin) => recipientIds.add(admin.id));
    }

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
        `[ConversationLimitNotification] Creator not found: ${chatbot.createdBy}`,
      );
      return;
    }

    const allRecipients: Recipient[] = [
      creator,
      ...orgAdmins.filter((a) => a.id !== creator.id),
    ];

    const notificationPromises = allRecipients.map((recipient) =>
      notificationService
        .notifyConversationLimitReached(
          recipient.id,
          chatbot.id,
          chatbot.name,
          currentCount,
          limit,
        )
        .catch((err) => {
          console.error(
            `[ConversationLimitNotification] Failed to create notification for ${recipient.id}:`,
            err,
          );
        }),
    );

    const emailPromises = allRecipients.map((recipient) =>
      sendConversationLimitEmail(
        recipient.email,
        recipient.name || recipient.email,
        chatbot.name,
        chatbot.id,
        currentCount,
        limit,
      ).catch((err) => {
        console.error(
          `[ConversationLimitNotification] Failed to send email to ${recipient.email}:`,
          err,
        );
      }),
    );

    await Promise.allSettled([...notificationPromises, ...emailPromises]);
  } catch (error) {
    console.error(
      "[ConversationLimitNotification] Failed to send notifications:",
      error,
    );
  }
}
