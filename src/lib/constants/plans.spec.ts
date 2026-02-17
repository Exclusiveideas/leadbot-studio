import { describe, expect, test } from "vitest";
import {
  hasFeature,
  getChatbotLimit,
  getConversationLimit,
  PLAN_CONFIG,
} from "./plans";
import type { PlanTier, Feature } from "./plans";

describe("PLAN_CONFIG", () => {
  const tiers: PlanTier[] = ["BASIC", "PRO", "AGENCY"];

  test("all tiers have valid configs with required fields", () => {
    for (const tier of tiers) {
      const config = PLAN_CONFIG[tier];
      expect(config.name).toBeTypeOf("string");
      expect(config.maxChatbots).toBeGreaterThan(0);
      expect(config.features.size).toBeGreaterThan(0);
    }
  });

  test("chatbot limits increase with tier", () => {
    expect(PLAN_CONFIG.BASIC.maxChatbots).toBe(1);
    expect(PLAN_CONFIG.PRO.maxChatbots).toBe(3);
    expect(PLAN_CONFIG.AGENCY.maxChatbots).toBe(10);
  });

  test("only BASIC has conversation limit", () => {
    expect(PLAN_CONFIG.BASIC.maxConversationsPerMonth).toBe(500);
    expect(PLAN_CONFIG.PRO.maxConversationsPerMonth).toBeNull();
    expect(PLAN_CONFIG.AGENCY.maxConversationsPerMonth).toBeNull();
  });

  test("higher tiers are supersets of lower tiers", () => {
    for (const feature of PLAN_CONFIG.BASIC.features) {
      expect(PLAN_CONFIG.PRO.features.has(feature)).toBe(true);
      expect(PLAN_CONFIG.AGENCY.features.has(feature)).toBe(true);
    }
    for (const feature of PLAN_CONFIG.PRO.features) {
      expect(PLAN_CONFIG.AGENCY.features.has(feature)).toBe(true);
    }
  });
});

describe("hasFeature", () => {
  test("BASIC has knowledge_base and lead_forms", () => {
    expect(hasFeature("BASIC", "knowledge_base")).toBe(true);
    expect(hasFeature("BASIC", "lead_forms")).toBe(true);
  });

  test("BASIC does not have pro features", () => {
    const proOnlyFeatures: Feature[] = [
      "booking_wizard",
      "text_request",
      "white_label",
      "advanced_analytics",
      "conditional_forms",
      "multi_step_forms",
    ];
    for (const feature of proOnlyFeatures) {
      expect(hasFeature("BASIC", feature)).toBe(false);
    }
  });

  test("PRO has all basic + pro features", () => {
    expect(hasFeature("PRO", "knowledge_base")).toBe(true);
    expect(hasFeature("PRO", "booking_wizard")).toBe(true);
    expect(hasFeature("PRO", "white_label")).toBe(true);
  });

  test("PRO does not have agency-only features", () => {
    expect(hasFeature("PRO", "team_management")).toBe(false);
  });

  test("AGENCY has team_management", () => {
    expect(hasFeature("AGENCY", "team_management")).toBe(true);
  });
});

describe("getChatbotLimit", () => {
  test("returns correct limits per plan", () => {
    expect(getChatbotLimit("BASIC")).toBe(1);
    expect(getChatbotLimit("PRO")).toBe(3);
    expect(getChatbotLimit("AGENCY")).toBe(10);
  });
});

describe("getConversationLimit", () => {
  test("returns 500 for BASIC", () => {
    expect(getConversationLimit("BASIC")).toBe(500);
  });

  test("returns null for PRO and AGENCY", () => {
    expect(getConversationLimit("PRO")).toBeNull();
    expect(getConversationLimit("AGENCY")).toBeNull();
  });
});
