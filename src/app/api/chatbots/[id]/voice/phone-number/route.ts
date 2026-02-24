import { withRLS } from "@/lib/middleware/rls-wrapper";
import { NextResponse } from "next/server";
import {
  searchAvailableNumbers,
  purchaseNumber,
  releaseNumber,
} from "@/lib/services/voice/twilioPhoneService";

/**
 * POST /api/chatbots/[id]/voice/phone-number
 * Search for available numbers or purchase a specific number.
 *
 * Body: { action: "search", country?: string, areaCode?: string }
 *    or { action: "purchase", phoneNumber: string }
 */
export const POST = withRLS(
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
    const { action } = body;

    if (action === "search") {
      const country = body.country ?? "US";
      const areaCode = body.areaCode;

      const numbers = await searchAvailableNumbers(country, areaCode);
      return NextResponse.json({ success: true, data: numbers });
    }

    if (action === "purchase") {
      const { phoneNumber } = body;
      if (!phoneNumber) {
        return NextResponse.json(
          { success: false, error: "phoneNumber is required" },
          { status: 400 },
        );
      }

      // Check if chatbot already has a phone number
      const existing = await tx.voiceConfig.findUnique({
        where: { chatbotId: id },
        select: { twilioPhoneNumber: true },
      });

      if (existing?.twilioPhoneNumber) {
        return NextResponse.json(
          {
            success: false,
            error: "Chatbot already has a phone number assigned",
          },
          { status: 409 },
        );
      }

      const purchased = await purchaseNumber(phoneNumber, id);

      await tx.voiceConfig.upsert({
        where: { chatbotId: id },
        create: {
          chatbotId: id,
          enabled: false,
          twilioPhoneNumber: purchased.phoneNumber,
          twilioPhoneSid: purchased.sid,
          voiceId: "rachel",
          voiceName: "Rachel",
          greetingMessage:
            "Hello! Thank you for calling. How can I help you today?",
        },
        update: {
          twilioPhoneNumber: purchased.phoneNumber,
          twilioPhoneSid: purchased.sid,
        },
      });

      return NextResponse.json({ success: true, data: purchased });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action. Use 'search' or 'purchase'." },
      { status: 400 },
    );
  },
  { routeName: "POST /api/chatbots/[id]/voice/phone-number" },
);

/**
 * DELETE /api/chatbots/[id]/voice/phone-number
 * Release the phone number assigned to this chatbot.
 */
export const DELETE = withRLS(
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
      select: { twilioPhoneSid: true, twilioPhoneNumber: true },
    });

    if (!voiceConfig?.twilioPhoneSid) {
      return NextResponse.json(
        { success: false, error: "No phone number assigned" },
        { status: 404 },
      );
    }

    await releaseNumber(voiceConfig.twilioPhoneSid);

    await tx.voiceConfig.update({
      where: { chatbotId: id },
      data: {
        twilioPhoneNumber: null,
        twilioPhoneSid: null,
        enabled: false,
      },
    });

    return NextResponse.json({ success: true });
  },
  { routeName: "DELETE /api/chatbots/[id]/voice/phone-number" },
);
