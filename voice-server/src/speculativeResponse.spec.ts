import { describe, expect, test } from "vitest";
import { isSpeculativeMatch } from "./speculativeResponse.js";

describe("isSpeculativeMatch", () => {
  test("returns true for identical text", () => {
    expect(
      isSpeculativeMatch("what are your hours", "what are your hours"),
    ).toBe(true);
  });

  test("returns true for close matches (>80% overlap)", () => {
    expect(
      isSpeculativeMatch(
        "what are your business hours",
        "what are your business hours today",
      ),
    ).toBe(true);
  });

  test("returns false for unrelated text", () => {
    expect(
      isSpeculativeMatch(
        "what are your hours",
        "can I schedule an appointment",
      ),
    ).toBe(false);
  });

  test("returns false for empty strings", () => {
    expect(isSpeculativeMatch("", "what are your hours")).toBe(false);
    expect(isSpeculativeMatch("what are your hours", "")).toBe(false);
    expect(isSpeculativeMatch("", "")).toBe(false);
  });

  test("is case-insensitive", () => {
    expect(
      isSpeculativeMatch("What Are Your Hours", "what are your hours"),
    ).toBe(true);
  });

  test("returns false for low overlap", () => {
    expect(
      isSpeculativeMatch(
        "I need to cancel my appointment",
        "what are the pricing options for services",
      ),
    ).toBe(false);
  });
});
