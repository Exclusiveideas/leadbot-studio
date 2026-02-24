import { describe, expect, test } from "vitest";
import { estimateFillerDelay, isBackchannel } from "./callSession.js";

describe("estimateFillerDelay", () => {
  test("returns 400ms for short utterances (1-4 words)", () => {
    expect(estimateFillerDelay("What time?")).toBe(400);
    expect(estimateFillerDelay("Yes")).toBe(400);
    expect(estimateFillerDelay("Is it open")).toBe(400);
  });

  test("returns 300ms for medium utterances (5-10 words)", () => {
    expect(
      estimateFillerDelay("Can I schedule an appointment for tomorrow"),
    ).toBe(300);
    expect(estimateFillerDelay("I need to talk to someone about this")).toBe(
      300,
    );
  });

  test("returns 200ms for long utterances (11+ words)", () => {
    expect(
      estimateFillerDelay(
        "I have been trying to reach someone about my account for the past three days now",
      ),
    ).toBe(200);
  });

  test("returns 200ms for complex utterances with keywords", () => {
    expect(estimateFillerDelay("How does this work")).toBe(200);
    expect(estimateFillerDelay("Why is it taking so long")).toBe(200);
    expect(estimateFillerDelay("Explain that to me")).toBe(200);
  });

  test("complexity keyword overrides short word count", () => {
    expect(estimateFillerDelay("How much")).toBe(200);
    expect(estimateFillerDelay("Why not")).toBe(200);
  });
});

describe("isBackchannel", () => {
  test("recognizes known backchannel words", () => {
    expect(isBackchannel("uh-huh")).toBe(true);
    expect(isBackchannel("mm-hmm")).toBe(true);
    expect(isBackchannel("yeah")).toBe(true);
    expect(isBackchannel("yep")).toBe(true);
    expect(isBackchannel("okay")).toBe(true);
    expect(isBackchannel("ok")).toBe(true);
    expect(isBackchannel("right")).toBe(true);
    expect(isBackchannel("sure")).toBe(true);
    expect(isBackchannel("got it")).toBe(true);
    expect(isBackchannel("mhm")).toBe(true);
    expect(isBackchannel("ah")).toBe(true);
  });

  test("returns false for real speech", () => {
    expect(isBackchannel("I need to reschedule my appointment")).toBe(false);
    expect(isBackchannel("What are your hours")).toBe(false);
    expect(isBackchannel("Can you transfer me")).toBe(false);
  });

  test("is case-insensitive", () => {
    expect(isBackchannel("Yeah")).toBe(true);
    expect(isBackchannel("OKAY")).toBe(true);
    expect(isBackchannel("Mm-Hmm")).toBe(true);
  });

  test("handles trailing punctuation", () => {
    expect(isBackchannel("yeah.")).toBe(true);
    expect(isBackchannel("okay!")).toBe(true);
    expect(isBackchannel("right,")).toBe(true);
    expect(isBackchannel("sure?")).toBe(true);
  });

  test("handles whitespace", () => {
    expect(isBackchannel("  yeah  ")).toBe(true);
    expect(isBackchannel(" ok ")).toBe(true);
  });
});
