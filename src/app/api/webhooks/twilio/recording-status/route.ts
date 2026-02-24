import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  validateTwilioWebhook,
  formDataToParams,
} from "@/lib/services/voice/twilioWebhookValidation";
import { notifyVoicemailReceived } from "@/lib/services/voice/voiceMinuteNotificationService";

/**
 * POST /api/webhooks/twilio/recording-status
 * Twilio recording status callback.
 * Saves the recording URL to the VoiceCall record.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const formParams = formDataToParams(formData);

  const validation = validateTwilioWebhook(request, formParams);
  if (!validation.valid) {
    console.error(
      "[Twilio recording-status] Signature validation failed:",
      validation.reason,
    );
    return new NextResponse("Forbidden", { status: 403 });
  }

  const callSid = formData.get("CallSid") as string | null;
  const recordingUrl = formData.get("RecordingUrl") as string | null;
  const recordingStatus = formData.get("RecordingStatus") as string | null;

  if (!callSid || !recordingUrl) {
    return NextResponse.json({ received: true });
  }

  if (recordingStatus !== "completed") {
    return NextResponse.json({ received: true });
  }

  try {
    // Idempotency: skip if recording URL is already set
    const voiceCall = await prisma.voiceCall.findUnique({
      where: { twilioCallSid: callSid },
      select: {
        recordingUrl: true,
        status: true,
        chatbotId: true,
        organizationId: true,
      },
    });

    if (!voiceCall || voiceCall.recordingUrl) {
      return NextResponse.json({ received: true });
    }

    await prisma.voiceCall.update({
      where: { twilioCallSid: callSid },
      data: { recordingUrl: `${recordingUrl}.mp3` },
    });

    console.log(
      `[Twilio recording-status] Recording saved: callSid=${callSid}`,
    );

    // Send voicemail notification if this was a voicemail call
    if (voiceCall.status === "VOICEMAIL") {
      notifyVoicemailReceived({
        callSid,
        chatbotId: voiceCall.chatbotId,
        organizationId: voiceCall.organizationId,
        recordingUrl: `${recordingUrl}.mp3`,
      }).catch((err) => {
        console.error(
          "[Twilio recording-status] Failed to send voicemail notification:",
          err,
        );
      });
    }
  } catch (error) {
    console.error("[Twilio recording-status] Failed to save recording:", error);
  }

  return NextResponse.json({ received: true });
}
