export type VoicePromptParams = {
  businessName: string;
  persona: string;
  customInstructions: string;
  systemPrompt: string | null;
  ragContext?: string;
};

export function buildVoiceSystemPrompt(params: VoicePromptParams): string {
  const {
    businessName,
    persona,
    customInstructions,
    systemPrompt,
    ragContext,
  } = params;

  const voiceRules = `You are a voice AI receptionist for ${businessName}. You are on a live phone call.

VOICE RULES:
- Keep responses to 1-3 sentences. The caller is listening, not reading.
- Use natural conversational language. No markdown, bullet points, or lists.
- Spell out numbers naturally ("five hundred dollars" not "$500").
- If you can't answer a question, use the transfer_call tool to connect them with a human.
- To capture a lead, use the capture_lead tool when the caller shares their contact info or interest.
- Use brief acknowledgments naturally: "Sure thing", "Absolutely", "Of course".
- Never mention being an AI unless directly asked.`;

  const parts = [voiceRules];

  if (ragContext) {
    parts.push(`KNOWLEDGE BASE:
Use the following information to answer the caller's questions accurately. If the answer isn't in the knowledge base, say you'll need to check on that and offer to transfer them to someone who can help.

${ragContext}`);
  }

  if (systemPrompt) {
    parts.push(systemPrompt);
  } else {
    if (persona) parts.push(`PERSONA:\n${persona}`);
    if (customInstructions)
      parts.push(`INSTRUCTIONS:\n${customInstructions}`);
  }

  return parts.join("\n\n");
}
