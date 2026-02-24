import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  recordVoiceMinutes,
  checkVoiceMinuteLimit,
} from "@/lib/services/voice/voiceUsageService";
import {
  notifyVoiceMinutesWarning,
  notifyVoiceMinutesExceeded,
} from "@/lib/services/voice/voiceMinuteNotificationService";
import {
  validateTwilioWebhook,
  formDataToParams,
} from "@/lib/services/voice/twilioWebhookValidation";
import { cache } from "@/lib/config/valkey";
import { generateCallSummary } from "@/lib/services/voice/callSummaryService";
import { decrementConcurrentCalls } from "@/lib/services/voice/concurrentCallService";

/**
 * POST /api/webhooks/twilio/voice-status
 * Twilio status callback for voice calls.
 * Updates the VoiceCall record and tracks usage.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const formParams = formDataToParams(formData);

  const validation = validateTwilioWebhook(request, formParams);
  if (!validation.valid) {
    console.error(
      "[Twilio voice-status webhook] Signature validation failed:",
      validation.reason,
    );
    return new NextResponse("Forbidden", { status: 403 });
  }

  const callSid = formData.get("CallSid") as string | null;
  const callStatus = formData.get("CallStatus") as string | null;
  const callDuration = formData.get("CallDuration") as string | null;

  if (!callSid) {
    return NextResponse.json({ error: "Missing CallSid" }, { status: 400 });
  }

  try {
    const voiceCall = await prisma.voiceCall.findUnique({
      where: { twilioCallSid: callSid },
    });

    if (!voiceCall) {
      return NextResponse.json({ received: true });
    }

    // Idempotency: skip if call is already in a terminal state
    const terminalStatuses = [
      "COMPLETED",
      "NO_ANSWER",
      "BUSY",
      "FAILED",
      "CANCELED",
      "VOICEMAIL",
    ];
    if (terminalStatuses.includes(voiceCall.status)) {
      return NextResponse.json({ received: true });
    }

    const statusMap: Record<string, string> = {
      completed: "COMPLETED",
      "no-answer": "NO_ANSWER",
      busy: "BUSY",
      failed: "FAILED",
      canceled: "CANCELED",
    };

    const mappedStatus = statusMap[callStatus ?? ""] ?? voiceCall.status;
    const durationSeconds = callDuration ? parseInt(callDuration, 10) : null;
    const durationMinutes = durationSeconds
      ? Math.ceil(durationSeconds / 60)
      : 0;

    await prisma.voiceCall.update({
      where: { twilioCallSid: callSid },
      data: {
        status: mappedStatus as any,
        endedAt: new Date(),
        durationSeconds,
      },
    });

    // Decrement concurrent call counter for terminal statuses
    if (terminalStatuses.includes(mappedStatus) && voiceCall.organizationId) {
      await decrementConcurrentCalls(voiceCall.organizationId);
    }

    // Track usage if call was completed with nonzero duration
    if (durationMinutes > 0 && voiceCall.organizationId) {
      await recordVoiceMinutes(
        prisma,
        voiceCall.organizationId,
        durationMinutes,
      );

      // Check thresholds and send notifications (fire-and-forget)
      checkAndNotifyUsageThreshold(
        voiceCall.organizationId,
        voiceCall.chatbotId,
      ).catch((err) => {
        console.error("Failed to check voice usage threshold:", err);
      });
    }

    // Generate AI summary for completed calls (fire-and-forget)
    if (
      mappedStatus === "COMPLETED" &&
      durationSeconds &&
      durationSeconds > 0
    ) {
      generateCallSummaryForCall(callSid).catch((err) => {
        console.error("Failed to generate call summary:", err);
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Twilio voice-status webhook error:", error);
    return NextResponse.json(
      { error: "Status update failed" },
      { status: 500 },
    );
  }
}

async function checkAndNotifyUsageThreshold(
  organizationId: string,
  chatbotId: string,
): Promise<void> {
  const chatbot = await prisma.chatbot.findUnique({
    where: { id: chatbotId },
    select: {
      name: true,
      createdBy: true,
      organization: { select: { plan: true } },
    },
  });

  if (!chatbot) return;

  const plan = chatbot.organization?.plan ?? null;
  const usage = await checkVoiceMinuteLimit(prisma, organizationId, plan);

  if (usage.limit === 0) return;

  const percentUsed = (usage.used / usage.limit) * 100;
  const notificationData = {
    chatbotId,
    chatbotName: chatbot.name,
    organizationId,
    createdBy: chatbot.createdBy,
    usedMinutes: usage.used,
    limitMinutes: usage.limit,
  };

  if (percentUsed >= 100) {
    const cacheKey = getNotifCacheKey(organizationId, "exceeded");
    const alreadySent = await cache.get(cacheKey);
    if (!alreadySent) {
      await notifyVoiceMinutesExceeded(notificationData);
      await cache.set(cacheKey, true, getRemainingSecondsInMonth());
    }
  } else if (percentUsed >= 80) {
    const cacheKey = getNotifCacheKey(organizationId, "warning");
    const alreadySent = await cache.get(cacheKey);
    if (!alreadySent) {
      await notifyVoiceMinutesWarning(notificationData);
      await cache.set(cacheKey, true, getRemainingSecondsInMonth());
    }
  }
}

function getNotifCacheKey(orgId: string, type: "warning" | "exceeded"): string {
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return `voice-notif:${orgId}:${monthKey}:${type}`;
}

function getRemainingSecondsInMonth(): number {
  const now = new Date();
  const endOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  return Math.ceil((endOfMonth.getTime() - now.getTime()) / 1000);
}

async function generateCallSummaryForCall(callSid: string): Promise<void> {
  // Wait briefly for the voice-server to finish writing the transcript
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const call = await prisma.voiceCall.findUnique({
    where: { twilioCallSid: callSid },
    select: { transcript: true },
  });

  if (!call?.transcript) return;

  const summary = await generateCallSummary(
    call.transcript as { role: "user" | "assistant"; content: string }[],
  );

  if (summary) {
    await prisma.voiceCall.update({
      where: { twilioCallSid: callSid },
      data: { summary },
    });
  }
}
