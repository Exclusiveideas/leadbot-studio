import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkVoiceMinuteLimit } from "@/lib/services/voice/voiceUsageService";
import {
  validateTwilioWebhook,
  formDataToParams,
} from "@/lib/services/voice/twilioWebhookValidation";
import {
  parseBusinessHours,
  isWithinBusinessHours,
} from "@/lib/services/voice/businessHoursService";
import {
  checkConcurrentCallLimit,
  incrementConcurrentCalls,
} from "@/lib/services/voice/concurrentCallService";

/**
 * POST /api/webhooks/twilio/voice
 * Twilio TwiML webhook for inbound voice calls.
 * Returns TwiML that connects the call to the voice WebSocket server.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const formParams = formDataToParams(formData);

  const validation = validateTwilioWebhook(request, formParams);
  if (!validation.valid) {
    console.error(
      "[Twilio voice webhook] Signature validation failed:",
      validation.reason,
    );
    return new NextResponse("Forbidden", { status: 403 });
  }

  const calledNumber = formData.get("Called") as string | null;
  const callerNumber = formData.get("From") as string | null;
  const callSid = formData.get("CallSid") as string | null;
  const accountSid = formData.get("AccountSid") as string | null;
  const callerCity = formData.get("CallerCity") as string | null;
  const callerState = formData.get("CallerState") as string | null;
  const callerCountry = formData.get("CallerCountry") as string | null;

  if (!calledNumber || !callSid) {
    return twimlResponse(
      "<Response><Say>Sorry, something went wrong.</Say><Hangup/></Response>",
    );
  }

  try {
    const voiceConfig = await prisma.voiceConfig.findFirst({
      where: { twilioPhoneNumber: calledNumber, enabled: true },
      include: {
        chatbot: {
          select: {
            id: true,
            organizationId: true,
            organization: { select: { plan: true } },
          },
        },
      },
    });

    if (!voiceConfig || !voiceConfig.chatbot) {
      return twimlResponse(
        "<Response><Say>Sorry, this number is not currently active.</Say><Hangup/></Response>",
      );
    }

    const chatbot = voiceConfig.chatbot;
    const organizationId = chatbot.organizationId ?? "";
    const plan = chatbot.organization?.plan ?? null;

    // Check business hours
    if (voiceConfig.businessHours) {
      const parsed = parseBusinessHours(voiceConfig.businessHours);
      if (parsed && !isWithinBusinessHours(parsed)) {
        const msg =
          voiceConfig.voiceMailMessage ??
          "We're currently closed. Please leave a message after the tone, or call back during our business hours.";

        const webhookBaseUrl =
          process.env.WEBHOOK_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "";
        const recordingCallback = webhookBaseUrl
          ? ` recordingStatusCallback="${webhookBaseUrl}/api/webhooks/twilio/recording-status" recordingStatusCallbackEvent="completed"`
          : "";

        await prisma.voiceCall.create({
          data: {
            chatbotId: chatbot.id,
            organizationId,
            twilioCallSid: callSid,
            twilioAccountSid: accountSid,
            direction: "INBOUND",
            status: "VOICEMAIL",
            callerNumber,
            calledNumber,
            callerCity,
            callerState,
            callerCountry,
          },
        });

        return twimlResponse(
          `<Response><Say>${escapeXml(msg)}</Say><Record maxLength="120" playBeep="true"${recordingCallback} /><Say>Thank you, goodbye.</Say><Hangup/></Response>`,
        );
      }
    }

    // Check voice minute limit
    const limitCheck = await checkVoiceMinuteLimit(
      prisma,
      organizationId,
      plan,
    );
    if (!limitCheck.allowed) {
      const webhookBaseUrl =
        process.env.WEBHOOK_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "";
      const recordingCallback = webhookBaseUrl
        ? ` recordingStatusCallback="${webhookBaseUrl}/api/webhooks/twilio/recording-status" recordingStatusCallbackEvent="completed"`
        : "";

      await prisma.voiceCall.create({
        data: {
          chatbotId: chatbot.id,
          organizationId,
          twilioCallSid: callSid,
          twilioAccountSid: accountSid,
          direction: "INBOUND",
          status: "VOICEMAIL",
          callerNumber,
          calledNumber,
          callerCity,
          callerState,
          callerCountry,
        },
      });

      return twimlResponse(
        `<Response><Say>We're sorry, our voice assistant is currently unavailable. Please leave a message after the tone, or try calling back at the beginning of next month. Thank you for your patience.</Say><Record maxLength="120" playBeep="true"${recordingCallback} /><Say>Thank you, goodbye.</Say><Hangup/></Response>`,
      );
    }

    // Check concurrent call limit
    const concurrentCheck = await checkConcurrentCallLimit(
      organizationId,
      plan,
    );
    if (!concurrentCheck.allowed) {
      return twimlResponse(
        "<Response><Say>All our lines are currently busy. Please try again shortly.</Say><Hangup/></Response>",
      );
    }

    // Create VoiceCall record
    await prisma.voiceCall.create({
      data: {
        chatbotId: chatbot.id,
        organizationId,
        twilioCallSid: callSid,
        twilioAccountSid: accountSid,
        direction: "INBOUND",
        status: "RINGING",
        callerNumber,
        calledNumber,
        callerCity,
        callerState,
        callerCountry,
      },
    });

    await incrementConcurrentCalls(organizationId);

    // Build TwiML to connect to voice WebSocket server
    const voiceWsUrl = process.env.VOICE_WS_URL;
    if (!voiceWsUrl) {
      console.error("VOICE_WS_URL not configured");
      return twimlResponse(
        "<Response><Say>Sorry, voice service is not available right now.</Say><Hangup/></Response>",
      );
    }

    const streamUrl = `${voiceWsUrl}/call?chatbotId=${chatbot.id}&callSid=${callSid}`;

    // Recording consent disclaimer if enabled
    const recordingDisclaimer = voiceConfig.recordingEnabled
      ? "<Say>This call may be recorded for quality and training purposes.</Say>"
      : "";

    const twiml = `<Response>${recordingDisclaimer}<Connect><Stream url="${streamUrl}"><Parameter name="chatbotId" value="${chatbot.id}" /><Parameter name="callSid" value="${callSid}" /></Stream></Connect></Response>`;

    return twimlResponse(twiml);
  } catch (error) {
    console.error("Twilio voice webhook error:", error);
    return twimlResponse(
      "<Response><Say>Sorry, an error occurred. Please try again later.</Say><Hangup/></Response>",
    );
  }
}

function twimlResponse(twiml: string): NextResponse {
  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
