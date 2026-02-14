/**
 * Booking Notification Service
 * Orchestrates sending notifications when bookings are created
 */

import { prisma } from "@/lib/db";
import { notificationService } from "./notificationService";
import { sendBookingNotificationEmail } from "@/lib/email/resend";

type BookingNotificationData = {
  chatbot: {
    id: string;
    name: string;
    createdBy: string;
    organizationId: string | null;
  };
  booking: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    categoryName: string;
    subCategoryName: string | null;
    locationName: string;
    locationAddress: string;
    appointmentDate: Date;
    appointmentTime: string;
    caseDescription: string | null;
  };
};

type Recipient = {
  id: string;
  email: string;
  name: string | null;
};

/**
 * Send notifications to chatbot creator and organization admins when a booking is created.
 * This is a fire-and-forget function - errors are logged but not thrown.
 */
export async function notifyBookingCreated(
  data: BookingNotificationData,
): Promise<void> {
  const { chatbot, booking } = data;

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
        `[BookingNotification] Creator not found: ${chatbot.createdBy}`,
      );
      return;
    }

    const allRecipients: Recipient[] = [
      creator,
      ...orgAdmins.filter((a) => a.id !== creator.id),
    ];

    const contactName = `${booking.firstName} ${booking.lastName}`;
    const formattedDate = booking.appointmentDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const notificationPromises = allRecipients.map((recipient) =>
      notificationService
        .notifyBookingCreated(
          recipient.id,
          booking.id,
          contactName,
          booking.email,
          formattedDate,
          booking.appointmentTime,
          chatbot.id,
          chatbot.name,
          booking.categoryName,
          booking.locationName,
        )
        .catch((err) => {
          console.error(
            `[BookingNotification] Failed to create notification for ${recipient.id}:`,
            err,
          );
        }),
    );

    const emailPromises = allRecipients.map((recipient) =>
      sendBookingNotificationEmail(
        recipient.email,
        recipient.name || recipient.email,
        contactName,
        booking.email,
        booking.phone,
        chatbot.name,
        chatbot.id,
        booking.categoryName,
        booking.subCategoryName || undefined,
        booking.locationName,
        booking.locationAddress,
        formattedDate,
        booking.appointmentTime,
        booking.caseDescription || undefined,
      ).catch((err) => {
        console.error(
          `[BookingNotification] Failed to send email to ${recipient.email}:`,
          err,
        );
      }),
    );

    await Promise.allSettled([...notificationPromises, ...emailPromises]);
  } catch (error) {
    console.error("[BookingNotification] Failed to send notifications:", error);
  }
}
