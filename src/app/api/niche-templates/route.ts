import { NextResponse } from "next/server";
import { getAllNicheTemplates } from "@/lib/constants/niches";

export async function GET() {
  const templates = getAllNicheTemplates();

  // Return a simplified version for the frontend (exclude full system prompts)
  const simplified = templates.map((t) => ({
    id: t.id,
    name: t.name,
    tagline: t.tagline,
    description: t.description,
    icon: t.icon,
    color: t.color,
    tonePreset: t.tonePreset,
    suggestedQuestions: t.suggestedQuestions,
    defaultLeadFormFields: t.defaultLeadFormFields,
    bookingCategories: t.bookingCategories,
    defaultWelcomeMessage: t.defaultWelcomeMessage,
    defaultChatGreeting: t.defaultChatGreeting,
    defaultAppearance: t.defaultAppearance,
    qualificationQuestions: t.qualificationQuestions,
    successMessage: t.successMessage,
  }));

  return NextResponse.json({ success: true, data: simplified });
}
