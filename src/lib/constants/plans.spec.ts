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
  const tiers: PlanTier[] = ["FREE", "BASIC", "PRO", "AGENCY"];

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
    expect(PLAN_CONFIG.FREE.maxChatbots).toBe(1);
    expect(PLAN_CONFIG.BASIC.maxChatbots).toBe(1);
    expect(PLAN_CONFIG.PRO.maxChatbots).toBe(3);
    expect(PLAN_CONFIG.AGENCY.maxChatbots).toBe(10);
  });

  test("only FREE and BASIC have conversation limits", () => {
    expect(PLAN_CONFIG.FREE.maxConversationsPerMonth).toBe(500);
    expect(PLAN_CONFIG.BASIC.maxConversationsPerMonth).toBe(500);
    expect(PLAN_CONFIG.PRO.maxConversationsPerMonth).toBeNull();
    expect(PLAN_CONFIG.AGENCY.maxConversationsPerMonth).toBeNull();
  });

  test("higher tiers are supersets of lower tiers", () => {
    for (const feature of PLAN_CONFIG.FREE.features) {
      expect(PLAN_CONFIG.BASIC.features.has(feature)).toBe(true);
      expect(PLAN_CONFIG.PRO.features.has(feature)).toBe(true);
      expect(PLAN_CONFIG.AGENCY.features.has(feature)).toBe(true);
    }
    for (const feature of PLAN_CONFIG.BASIC.features) {
      expect(PLAN_CONFIG.PRO.features.has(feature)).toBe(true);
      expect(PLAN_CONFIG.AGENCY.features.has(feature)).toBe(true);
    }
    for (const feature of PLAN_CONFIG.PRO.features) {
      expect(PLAN_CONFIG.AGENCY.features.has(feature)).toBe(true);
    }
  });

  test("FREE plan is free, paid plans have positive prices", () => {
    expect(PLAN_CONFIG.FREE.pricing.monthly).toBe(0);
    expect(PLAN_CONFIG.FREE.pricing.annual).toBe(0);
    expect(PLAN_CONFIG.BASIC.pricing.monthly).toBe(20);
    expect(PLAN_CONFIG.BASIC.pricing.annual).toBe(200);
    expect(PLAN_CONFIG.PRO.pricing.monthly).toBe(50);
    expect(PLAN_CONFIG.PRO.pricing.annual).toBe(500);
    expect(PLAN_CONFIG.AGENCY.pricing.monthly).toBe(150);
    expect(PLAN_CONFIG.AGENCY.pricing.annual).toBe(1500);
  });

  test("annual pricing gives 2 months free for all paid plans", () => {
    expect(PLAN_CONFIG.BASIC.pricing.annual).toBe(
      PLAN_CONFIG.BASIC.pricing.monthly * 10,
    );
    expect(PLAN_CONFIG.PRO.pricing.annual).toBe(
      PLAN_CONFIG.PRO.pricing.monthly * 10,
    );
    expect(PLAN_CONFIG.AGENCY.pricing.annual).toBe(
      PLAN_CONFIG.AGENCY.pricing.monthly * 10,
    );
  });

  test("FREE has no Stripe price IDs", () => {
    expect(PLAN_CONFIG.FREE.pricing.stripePriceMonthly).toBeNull();
    expect(PLAN_CONFIG.FREE.pricing.stripePriceAnnual).toBeNull();
  });
});

describe("hasFeature", () => {
  test("FREE has knowledge_base but not publish_chatbot", () => {
    expect(hasFeature("FREE", "knowledge_base")).toBe(true);
    expect(hasFeature("FREE", "lead_forms")).toBe(true);
    expect(hasFeature("FREE", "publish_chatbot")).toBe(false);
  });

  test("BASIC has publish_chatbot", () => {
    expect(hasFeature("BASIC", "publish_chatbot")).toBe(true);
    expect(hasFeature("BASIC", "knowledge_base")).toBe(true);
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
    expect(hasFeature("PRO", "publish_chatbot")).toBe(true);
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
    expect(getChatbotLimit("FREE")).toBe(1);
    expect(getChatbotLimit("BASIC")).toBe(1);
    expect(getChatbotLimit("PRO")).toBe(3);
    expect(getChatbotLimit("AGENCY")).toBe(10);
  });
});

describe("getConversationLimit", () => {
  test("returns 500 for FREE and BASIC", () => {
    expect(getConversationLimit("FREE")).toBe(500);
    expect(getConversationLimit("BASIC")).toBe(500);
  });

  test("returns null for PRO and AGENCY", () => {
    expect(getConversationLimit("PRO")).toBeNull();
    expect(getConversationLimit("AGENCY")).toBeNull();
  });
});

describe("getStripePriceId", () => {
  test("returns null for FREE plan regardless of interval", () => {
    expect(getStripePriceId("FREE", "monthly")).toBeNull();
    expect(getStripePriceId("FREE", "annual")).toBeNull();
  });

  test("returns price ID from config for all paid plans", () => {
    const paidTiers = ["BASIC", "PRO", "AGENCY"] as const;
    for (const tier of paidTiers) {
      expect(getStripePriceId(tier, "monthly")).toBe(
        PLAN_CONFIG[tier].pricing.stripePriceMonthly,
      );
      expect(getStripePriceId(tier, "annual")).toBe(
        PLAN_CONFIG[tier].pricing.stripePriceAnnual,
      );
    }
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
