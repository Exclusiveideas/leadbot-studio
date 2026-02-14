import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getNicheTemplate } from "@/lib/constants/niches";
import { getDefaultLeadFormForNiche } from "@/lib/constants/lead-form-templates";
import type { NicheType } from "@/lib/constants/niches";

/**
 * POST /api/onboarding
 * Creates a chatbot from the onboarding wizard with niche defaults applied.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      nicheType,
      businessName,
      businessDescription,
      services,
      websiteUrl,
      persona,
      customInstructions,
      appearance,
      welcomeMessage,
      chatGreeting,
      calendlyLink,
      bookingConfig,
      textConfig,
      suggestedQuestions,
    } = body;

    if (!nicheType || !businessName) {
      return NextResponse.json(
        { error: "nicheType and businessName are required" },
        { status: 400 },
      );
    }

    const template = getNicheTemplate(nicheType as NicheType);
    const embedCode = nanoid(12);

    const resolvedPersona =
      persona ||
      template.systemPromptTemplate
        .replace(/\{\{businessName\}\}/g, businessName)
        .replace(/\{\{customInstructions\}\}/g, customInstructions || "");

    const resolvedInstructions =
      customInstructions ||
      (services?.length ? `Services offered: ${services.join(", ")}` : "");

    const chatbot = await prisma.chatbot.create({
      data: {
        name: businessName,
        description: businessDescription || template.description,
        nicheType: nicheType as NicheType,
        status: "DRAFT",
        aiModel: "claude-3-5-haiku",
        persona: resolvedPersona,
        customInstructions: resolvedInstructions,
        welcomeMessage: welcomeMessage || template.defaultWelcomeMessage,
        chatGreeting: chatGreeting || template.defaultChatGreeting,
        appearance: appearance || template.defaultAppearance,
        suggestedQuestions: suggestedQuestions || template.suggestedQuestions,
        embedCode,
        allowedDomains: websiteUrl ? [websiteUrl] : [],
        calendlyLink: calendlyLink || null,
        bookingConfig: bookingConfig || null,
        textConfig: textConfig || null,
        createdBy: session.userId,
      },
    });

    const defaultForm = getDefaultLeadFormForNiche(nicheType as NicheType);
    await prisma.chatbotLeadForm.create({
      data: {
        chatbotId: chatbot.id,
        name: defaultForm.name,
        description: defaultForm.description,
        fields: defaultForm.fields,
        appearance: defaultForm.appearance,
        behavior: defaultForm.behavior,
        isDefault: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        chatbotId: chatbot.id,
        embedCode: chatbot.embedCode,
        nicheType: chatbot.nicheType,
      },
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to create chatbot" },
      { status: 500 },
    );
  }
}
