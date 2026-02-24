import { describe, test, expect } from "vitest";
import { buildVoiceSystemPrompt } from "./voicePromptBuilder.js";

describe("buildVoiceSystemPrompt", () => {
  const baseParams = {
    businessName: "Acme Corp",
    persona: "Friendly and professional",
    customInstructions: "Always greet by name if known",
    systemPrompt: null,
  };

  test("includes voice rules and business name", () => {
    const result = buildVoiceSystemPrompt(baseParams);
    expect(result).toContain("voice AI receptionist for Acme Corp");
    expect(result).toContain("VOICE RULES:");
    expect(result).toContain("1-3 sentences");
  });

  test("includes persona and instructions when no systemPrompt", () => {
    const result = buildVoiceSystemPrompt(baseParams);
    expect(result).toContain("PERSONA:\nFriendly and professional");
    expect(result).toContain("INSTRUCTIONS:\nAlways greet by name if known");
  });

  test("uses systemPrompt over persona and instructions when provided", () => {
    const result = buildVoiceSystemPrompt({
      ...baseParams,
      systemPrompt: "You are a dental office receptionist.",
    });
    expect(result).toContain("You are a dental office receptionist.");
    expect(result).not.toContain("PERSONA:");
    expect(result).not.toContain("INSTRUCTIONS:");
  });

  test("includes knowledge base section when ragContext is provided", () => {
    const result = buildVoiceSystemPrompt({
      ...baseParams,
      ragContext: "[Source 1: FAQ]\nWe are open Monday to Friday 9am to 5pm.",
    });
    expect(result).toContain("KNOWLEDGE BASE:");
    expect(result).toContain("We are open Monday to Friday 9am to 5pm.");
    expect(result).toContain(
      "Use the following information to answer the caller's questions",
    );
  });

  test("omits knowledge base section when ragContext is empty", () => {
    const result = buildVoiceSystemPrompt({
      ...baseParams,
      ragContext: "",
    });
    expect(result).not.toContain("KNOWLEDGE BASE:");
  });

  test("omits knowledge base section when ragContext is undefined", () => {
    const result = buildVoiceSystemPrompt(baseParams);
    expect(result).not.toContain("KNOWLEDGE BASE:");
  });

  test("knowledge base appears between voice rules and persona", () => {
    const result = buildVoiceSystemPrompt({
      ...baseParams,
      ragContext: "[Source 1: Info]\nSome context here.",
    });
    const voiceRulesIdx = result.indexOf("VOICE RULES:");
    const knowledgeIdx = result.indexOf("KNOWLEDGE BASE:");
    const personaIdx = result.indexOf("PERSONA:");
    expect(voiceRulesIdx).toBeLessThan(knowledgeIdx);
    expect(knowledgeIdx).toBeLessThan(personaIdx);
  });
});
