import { withRLS } from "@/lib/middleware/rls-wrapper";
import { NextResponse } from "next/server";

/**
 * GET /api/chatbots/[id]/voice
 * Get voice configuration for a chatbot
 */
export const GET = withRLS(
  async (_request, session, _rlsContext, tx, context) => {
    const { id } = await context.params;

    const chatbot = await tx.chatbot.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!chatbot || chatbot.organizationId !== session.user.organization.id) {
      return NextResponse.json(
        { success: false, error: "Chatbot not found" },
        { status: 404 },
      );
    }

    const voiceConfig = await tx.voiceConfig.findUnique({
      where: { chatbotId: id },
    });

    return NextResponse.json({
      success: true,
      data: voiceConfig,
    });
  },
  { routeName: "GET /api/chatbots/[id]/voice" },
);

/**
 * PUT /api/chatbots/[id]/voice
 * Update voice configuration for a chatbot
 */
export const PUT = withRLS(
  async (request, session, _rlsContext, tx, context) => {
    const { id } = await context.params;

    const chatbot = await tx.chatbot.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!chatbot || chatbot.organizationId !== session.user.organization.id) {
      return NextResponse.json(
        { success: false, error: "Chatbot not found" },
        { status: 404 },
      );
    }

    const body = await request.json();

    const voiceConfig = await tx.voiceConfig.upsert({
      where: { chatbotId: id },
      create: {
        chatbotId: id,
        enabled: body.enabled ?? false,
        voiceId: body.voiceId ?? "rachel",
        voiceName: body.voiceName ?? "Rachel",
        greetingMessage:
          body.greetingMessage ??
          "Hello! Thank you for calling. How can I help you today?",
        voiceMailMessage: body.voiceMailMessage,
        maxCallDurationSeconds: body.maxCallDurationSeconds ?? 600,
        silenceTimeoutSeconds: body.silenceTimeoutSeconds ?? 10,
        language: body.language ?? "en",
        businessHours: body.businessHours,
        transferEnabled: body.transferEnabled ?? false,
        transferPhoneNumber: body.transferPhoneNumber,
        recordingEnabled: body.recordingEnabled ?? false,
      },
      update: {
        ...(body.enabled !== undefined && { enabled: body.enabled }),
        ...(body.voiceId && { voiceId: body.voiceId }),
        ...(body.voiceName && { voiceName: body.voiceName }),
        ...(body.greetingMessage && { greetingMessage: body.greetingMessage }),
        ...(body.voiceMailMessage !== undefined && {
          voiceMailMessage: body.voiceMailMessage,
        }),
        ...(body.maxCallDurationSeconds && {
          maxCallDurationSeconds: body.maxCallDurationSeconds,
        }),
        ...(body.silenceTimeoutSeconds && {
          silenceTimeoutSeconds: body.silenceTimeoutSeconds,
        }),
        ...(body.language && { language: body.language }),
        ...(body.businessHours !== undefined && {
          businessHours: body.businessHours,
        }),
        ...(body.transferEnabled !== undefined && {
          transferEnabled: body.transferEnabled,
        }),
        ...(body.transferPhoneNumber !== undefined && {
          transferPhoneNumber: body.transferPhoneNumber,
        }),
        ...(body.recordingEnabled !== undefined && {
          recordingEnabled: body.recordingEnabled,
        }),
      },
    });

    return NextResponse.json({ success: true, data: voiceConfig });
  },
  { routeName: "PUT /api/chatbots/[id]/voice" },
);
