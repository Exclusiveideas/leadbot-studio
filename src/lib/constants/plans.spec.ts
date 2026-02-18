import { describe, expect, test } from "vitest";
import {
  hasFeature,
  getChatbotLimit,
  getConversationLimit,
  getStripePriceId,
  getPlanFromStripePriceId,
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
      expect(config.pricing).toBeDefined();
      expect(config.pricing.monthly).toBeTypeOf("number");
      expect(config.pricing.annual).toBeTypeOf("number");
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

  test("BASIC plan is free, paid plans have positive prices", () => {
    expect(PLAN_CONFIG.BASIC.pricing.monthly).toBe(0);
    expect(PLAN_CONFIG.BASIC.pricing.annual).toBe(0);
    expect(PLAN_CONFIG.PRO.pricing.monthly).toBe(50);
    expect(PLAN_CONFIG.PRO.pricing.annual).toBe(500);
    expect(PLAN_CONFIG.AGENCY.pricing.monthly).toBe(150);
    expect(PLAN_CONFIG.AGENCY.pricing.annual).toBe(1500);
  });

  test("annual pricing gives 2 months free", () => {
    expect(PLAN_CONFIG.PRO.pricing.annual).toBe(
      PLAN_CONFIG.PRO.pricing.monthly * 10,
    );
    expect(PLAN_CONFIG.AGENCY.pricing.annual).toBe(
      PLAN_CONFIG.AGENCY.pricing.monthly * 10,
    );
  });

  test("BASIC has no Stripe price IDs", () => {
    expect(PLAN_CONFIG.BASIC.pricing.stripePriceMonthly).toBeNull();
    expect(PLAN_CONFIG.BASIC.pricing.stripePriceAnnual).toBeNull();
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

describe("getStripePriceId", () => {
  test("returns null for BASIC plan regardless of interval", () => {
    expect(getStripePriceId("BASIC", "monthly")).toBeNull();
    expect(getStripePriceId("BASIC", "annual")).toBeNull();
  });

  test("returns price ID from config for paid plans", () => {
    const proMonthly = getStripePriceId("PRO", "monthly");
    const proAnnual = getStripePriceId("PRO", "annual");
    expect(proMonthly).toBe(PLAN_CONFIG.PRO.pricing.stripePriceMonthly);
    expect(proAnnual).toBe(PLAN_CONFIG.PRO.pricing.stripePriceAnnual);
  });
});

describe("getPlanFromStripePriceId", () => {
  test("returns null for unknown price ID", () => {
    expect(getPlanFromStripePriceId("price_unknown_123")).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(getPlanFromStripePriceId("")).toBeNull();
  });
});
