import { prisma } from "@/lib/db";
import { notificationService } from "../notificationService";

type VoiceMinuteNotificationData = {
  chatbotId: string;
  chatbotName: string;
  organizationId: string;
  createdBy: string;
  usedMinutes: number;
  limitMinutes: number;
};

type Recipient = {
  id: string;
  email: string;
  name: string | null;
};

async function getRecipients(
  createdBy: string,
  organizationId: string,
): Promise<Recipient[]> {
  const recipientIds = new Set<string>();
  recipientIds.add(createdBy);

  const orgAdmins = await prisma.user.findMany({
    where: {
      organizationId,
      organizationRole: "OWNER",
    },
    select: { id: true, email: true, name: true },
  });

  orgAdmins.forEach((admin) => recipientIds.add(admin.id));

  const creator = await prisma.user.findUnique({
    where: { id: createdBy },
    select: { id: true, email: true, name: true },
  });

  if (!creator) {
    console.error(`[VoiceMinuteNotification] Creator not found: ${createdBy}`);
    return orgAdmins;
  }

  return [creator, ...orgAdmins.filter((a) => a.id !== creator.id)];
}

export async function notifyVoiceMinutesWarning(
  data: VoiceMinuteNotificationData,
): Promise<void> {
  try {
    const recipients = await getRecipients(data.createdBy, data.organizationId);

    const promises = recipients.map((recipient) =>
      notificationService
        .notifyVoiceMinutesWarning(
          recipient.id,
          data.chatbotId,
          data.chatbotName,
          data.usedMinutes,
          data.limitMinutes,
        )
        .catch((err) => {
          console.error(
            `[VoiceMinuteNotification] Failed to create warning for ${recipient.id}:`,
            err,
          );
        }),
    );

    await Promise.allSettled(promises);
  } catch (error) {
    console.error(
      "[VoiceMinuteNotification] Failed to send warning notifications:",
      error,
    );
  }
}

type VoicemailNotificationData = {
  callSid: string;
  chatbotId: string;
  organizationId: string;
  recordingUrl: string;
};

export async function notifyVoicemailReceived(
  data: VoicemailNotificationData,
): Promise<void> {
  try {
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: data.chatbotId },
      select: { name: true, createdBy: true },
    });
    if (!chatbot) return;

    const voiceCall = await prisma.voiceCall.findUnique({
      where: { twilioCallSid: data.callSid },
      select: { id: true, callerNumber: true },
    });
    if (!voiceCall) return;

    const recipients = await getRecipients(
      chatbot.createdBy,
      data.organizationId,
    );

    const promises = recipients.map((recipient) =>
      notificationService
        .notifyVoicemailReceived(
          recipient.id,
          voiceCall.id,
          data.chatbotId,
          chatbot.name,
          voiceCall.callerNumber || "",
          data.recordingUrl,
        )
        .catch((err) => {
          console.error(
            `[VoicemailNotification] Failed to create notification for ${recipient.id}:`,
            err,
          );
        }),
    );

    await Promise.allSettled(promises);
  } catch (error) {
    console.error(
      "[VoicemailNotification] Failed to send voicemail notifications:",
      error,
    );
  }
}

export async function notifyVoiceMinutesExceeded(
  data: VoiceMinuteNotificationData,
): Promise<void> {
  try {
    const recipients = await getRecipients(data.createdBy, data.organizationId);

    const promises = recipients.map((recipient) =>
      notificationService
        .notifyVoiceMinutesExceeded(
          recipient.id,
          data.chatbotId,
          data.chatbotName,
          data.usedMinutes,
          data.limitMinutes,
        )
        .catch((err) => {
          console.error(
            `[VoiceMinuteNotification] Failed to create exceeded for ${recipient.id}:`,
            err,
          );
        }),
    );

    await Promise.allSettled(promises);
  } catch (error) {
    console.error(
      "[VoiceMinuteNotification] Failed to send exceeded notifications:",
      error,
    );
  }
}
