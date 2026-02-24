import { describe, expect, test } from "vitest";
import {
  getRandomFiller,
  FILLER_PHRASES,
  ACKNOWLEDGMENT_PHRASES,
} from "./fillerAudio.js";

describe("getRandomFiller", () => {
  test("returns null for empty array", () => {
    expect(getRandomFiller([])).toBeNull();
  });

  test("returns a member of the input array", () => {
    const fillers = ["audio1", "audio2", "audio3"];
    const result = getRandomFiller(fillers);
    expect(fillers).toContain(result);
  });

  test("returns the only element for single-element array", () => {
    expect(getRandomFiller(["only"])).toBe("only");
  });
});

describe("FILLER_PHRASES", () => {
  test("contains 10 phrases", () => {
    expect(FILLER_PHRASES).toHaveLength(10);
  });

  test("all phrases are non-empty strings", () => {
    for (const phrase of FILLER_PHRASES) {
      expect(typeof phrase).toBe("string");
      expect(phrase.length).toBeGreaterThan(0);
    }
  });
});

describe("ACKNOWLEDGMENT_PHRASES", () => {
  test("contains 5 phrases", () => {
    expect(ACKNOWLEDGMENT_PHRASES).toHaveLength(5);
  });

  test("all phrases are short (under 15 chars)", () => {
    for (const phrase of ACKNOWLEDGMENT_PHRASES) {
      expect(phrase.length).toBeLessThan(15);
    }
  });
});
