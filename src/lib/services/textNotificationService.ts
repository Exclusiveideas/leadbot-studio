/**
 * Text Request Notification Service
 * Orchestrates sending notifications when text requests are created
 */

import { prisma } from "@/lib/db";
import { notificationService } from "./notificationService";
import { sendTextRequestNotificationEmail } from "@/lib/email/resend";

type TextRequestNotificationData = {
  chatbot: {
    id: string;
    name: string;
    createdBy: string;
    organizationId: string | null;
  };
  textRequest: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string;
    message: string;
  };
};

type Recipient = {
  id: string;
  email: string;
  name: string | null;
};

/**
 * Send notifications to chatbot creator and organization admins when a text request is created.
 * This is a fire-and-forget function - errors are logged but not thrown.
 */
export async function notifyTextRequestCreated(
  data: TextRequestNotificationData,
): Promise<void> {
  const { chatbot, textRequest } = data;

  try {
    const recipientIds = new Set<string>();
    recipientIds.add(chatbot.createdBy);

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
        `[TextNotification] Creator not found: ${chatbot.createdBy}`,
      );
      return;
    }

    const allRecipients: Recipient[] = [
      creator,
      ...orgAdmins.filter((a) => a.id !== creator.id),
    ];

    const contactName = `${textRequest.firstName} ${textRequest.lastName}`;
    const messagePreview =
      textRequest.message.length > 100
        ? `${textRequest.message.substring(0, 100)}...`
        : textRequest.message;

    const notificationPromises = allRecipients.map((recipient) =>
      notificationService
        .notifyTextRequestCreated(
          recipient.id,
          textRequest.id,
          contactName,
          textRequest.phone,
          chatbot.id,
          chatbot.name,
          messagePreview,
        )
        .catch((err) => {
          console.error(
            `[TextNotification] Failed to create notification for ${recipient.id}:`,
            err,
          );
        }),
    );

    const emailPromises = allRecipients.map((recipient) =>
      sendTextRequestNotificationEmail(
        recipient.email,
        recipient.name || recipient.email,
        contactName,
        textRequest.phone,
        textRequest.email,
        chatbot.name,
        chatbot.id,
        textRequest.message,
      ).catch((err) => {
        console.error(
          `[TextNotification] Failed to send email to ${recipient.email}:`,
          err,
        );
      }),
    );

    await Promise.allSettled([...notificationPromises, ...emailPromises]);
  } catch (error) {
    console.error("[TextNotification] Failed to send notifications:", error);
  }
}
