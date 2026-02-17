import type { NicheType, TonePreset } from "@/lib/constants/niches";
import { getNicheTemplate } from "@/lib/constants/niches";

// ─── Tone descriptions ───────────────────────────────────────────────────────

const TONE_DESCRIPTIONS: Record<TonePreset, string> = {
  professional: "Professional, knowledgeable, and consultative",
  friendly: "Warm, approachable, encouraging, and conversational",
  compassionate: "Warm, validating, empathetic, and non-judgmental",
  authoritative: "Confident, educational, trustworthy, and measured",
  warm: "Enthusiastic, helpful, personable, and energetic",
  consultative: "Thoughtful, analytical, solution-oriented, and patient",
};

// ─── Niche-aware system prompt builder ───────────────────────────────────────

interface PromptBuilderInput {
  chatbotName: string;
  nicheType: NicheType;
  customInstructions: string;
  persona?: string;
  systemPrompt?: string;
}

/**
 * Build a lead-generation focused system prompt based on the chatbot's niche.
 * Priority: systemPrompt (explicit override) > persona (custom) > niche template.
 */
export function buildLeadGenerationSystemPrompt(
  input: PromptBuilderInput,
): string {
  // Highest priority: explicit system prompt override
  if (input.systemPrompt) {
    return input.systemPrompt;
  }

  // If a custom persona is provided (not from template), use it directly
  if (input.persona) {
    return `${input.persona}\n\n${input.customInstructions || ""}`;
  }

  // Use niche template
  const template = getNicheTemplate(input.nicheType);

  // Substitute placeholders in the template
  let prompt = template.systemPromptTemplate
    .replace(/\{\{businessName\}\}/g, input.chatbotName)
    .replace(/\{\{customInstructions\}\}/g, input.customInstructions || "");

  // Append booking section
  prompt += buildBookingSection();

  // Append lead capture section with niche-specific signals
  prompt += buildLeadCaptureSection(input.nicheType);

  // Append qualification questions if the niche has them
  if (template.qualificationQuestions.length > 0) {
    prompt += "\n\n### Lead Qualification (optional):\n";
    prompt +=
      "If the conversation flows naturally, you can ask these questions to qualify the lead:\n";
    template.qualificationQuestions.forEach((q) => {
      prompt += `- ${q.question}\n`;
    });
    prompt += "\nThese are OPTIONAL. Getting name and email is the priority.\n";
  }

  // Append boundaries
  if (template.boundaries.length > 0) {
    prompt += "\n\n## Important Boundaries:\n";
    template.boundaries.forEach((b) => {
      prompt += `- ${b}\n`;
    });
  }

  // Append tone
  prompt += `\n\n## Tone:\n${TONE_DESCRIPTIONS[template.tonePreset]}\n`;

  return prompt;
}

// ─── Booking section (shared across all niches) ─────────────────────────────

function buildBookingSection(): string {
  return `

## Booking & Scheduling — HIGHEST PRIORITY

**CRITICAL**: When a user wants to BOOK, SCHEDULE, or SET UP a call/meeting/consultation, you MUST use the "show_booking_trigger" tool. Do NOT use "show_lead_form" for booking requests.

### Booking Intent Triggers (USE show_booking_trigger):
- "I want to book a call"
- "Can I schedule a consultation?"
- "I'd like to speak with someone"
- "How do I schedule an appointment?"
- "Can we set up a meeting?"
- "Let's schedule a call"

### How to Handle Booking Intent:
When you detect booking intent, do TWO things in the SAME response:
1. **Send a brief text message** (e.g., "I'd be happy to help you schedule! Let me get you connected.")
2. **Call show_booking_trigger immediately** with a reason

**IMPORTANT**: Do NOT ask for name, email, phone first. Just call the tool — it will show a form to collect contact info.

### Key Difference:
- **show_booking_trigger**: User explicitly wants to BOOK/SCHEDULE something
- **show_lead_form**: User shares details about their situation or you want to capture their info for follow-up
`;
}

// ─── Lead capture section (niche-aware) ──────────────────────────────────────

function buildLeadCaptureSection(nicheType: NicheType): string {
  const template = getNicheTemplate(nicheType);

  // Build trigger signal examples from the niche template
  let triggerExamples = "";
  template.triggerSignals.forEach((signal, i) => {
    triggerExamples += `\n${i + 1}. **${signal.description}:**\n`;
    signal.examples.forEach((ex) => {
      triggerExamples += `   - "${ex}"\n`;
    });
  });

  return `
## Lead Capture Strategy — THIS IS CRITICAL

You have access to a tool called "show_lead_form" that displays a contact form to the user. Use this tool to capture leads.

You must ACTIVELY look for opportunities to connect users with the right person. This is your PRIMARY goal after building initial trust.

### When to Call show_lead_form Tool:

Call the show_lead_form tool immediately when you detect ANY of these signals:
${triggerExamples}
### How to Call the Tool:

When you detect a capture signal, do TWO things in the SAME response:
1. **Send a text message** explaining why you're connecting them with someone
2. **Call the show_lead_form tool** with the parameters below

**CRITICAL RULE**: NEVER call a tool without also sending a text message. The user must see your response.

**Tool Parameters:**
1. **reason**: Brief explanation of why you're showing the form
2. **extractedData**: Any information the user already mentioned:
   - name: If they mentioned their name
   - email: If they mentioned their email
   - phone: If they mentioned their phone
   - serviceType: The type of service or need they described
   - urgency: IMMEDIATE, THIS_WEEK, THIS_MONTH, or EXPLORING
3. **urgency**: Lead priority (high/medium/low)

### Important Rules:
- ONLY call show_lead_form ONCE per conversation
- DON'T call the tool if the user already filled out the form
- DON'T wait for user to ask — be proactive when signals are clear
- DO extract as much data as possible from conversation to pre-fill the form
- DO explain the value of connecting them with the right person
- If user declines the form, continue helping them anyway (don't be pushy)
- NEVER be pushy or salesy — position it as a helpful next step
`;
}

// ─── Tool override builder (for public chat route) ───────────────────────────

/**
 * Build the tool override section for the public chat API route.
 * This section is appended at the very end of the system prompt
 * to ensure the AI prioritizes booking and lead capture triggers.
 */
export function buildToolOverride(nicheType: NicheType): string {
  const template = getNicheTemplate(nicheType);

  let triggerExamples = "";
  template.triggerSignals.forEach((signal) => {
    triggerExamples += `- ${signal.description}: ${signal.examples.map((e) => `"${e}"`).join(", ")}\n`;
  });

  return `
---
## FINAL INSTRUCTIONS (OVERRIDE ALL ABOVE)

### BOOKING INTENT -> use show_booking_trigger tool
When user says "book a call", "schedule", "set up a meeting", or similar:
1. Send ONE short message
2. IMMEDIATELY call the show_booking_trigger tool

### LEAD CAPTURE INTENT -> use show_lead_form tool
When user expresses ANY of these signals, IMMEDIATELY call show_lead_form:
${triggerExamples}
### STRICT REQUIREMENTS:
1. When booking OR lead capture intent is detected, call the appropriate tool IMMEDIATELY
2. Do NOT ask for contact info first — the tools display forms that collect it
3. ALWAYS send a brief empathetic message WITH the tool call
4. Never call a tool without an accompanying text message
`;
}
