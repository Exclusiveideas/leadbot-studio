import { describe, expect, test } from "vitest";
import { PlanFeatureError, assertFeature } from "./planService";

describe("assertFeature", () => {
  test("does not throw for features included in the plan", () => {
    expect(() => assertFeature("BASIC", "knowledge_base")).not.toThrow();
    expect(() => assertFeature("PRO", "booking_wizard")).not.toThrow();
    expect(() => assertFeature("AGENCY", "team_management")).not.toThrow();
  });

  test("throws PlanFeatureError for features not in plan", () => {
    expect(() => assertFeature("BASIC", "booking_wizard")).toThrow(
      PlanFeatureError,
    );
    expect(() => assertFeature("BASIC", "white_label")).toThrow(
      PlanFeatureError,
    );
    expect(() => assertFeature("PRO", "team_management")).toThrow(
      PlanFeatureError,
    );
  });

  test("error includes feature and plan info", () => {
    try {
      assertFeature("BASIC", "booking_wizard");
    } catch (err) {
      expect(err).toBeInstanceOf(PlanFeatureError);
      const planErr = err as PlanFeatureError;
      expect(planErr.feature).toBe("booking_wizard");
      expect(planErr.plan).toBe("BASIC");
      expect(planErr.message).toContain("booking_wizard");
      expect(planErr.message).toContain("BASIC");
    }
  });
});
