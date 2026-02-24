import { describe, expect, test } from "vitest";
import { detectTone, getToneInstruction } from "./toneDetector.js";

describe("detectTone", () => {
  test("detects frustrated tone", () => {
    expect(detectTone("This is ridiculous, I've been waiting forever")).toBe(
      "frustrated",
    );
    expect(detectTone("My account doesn't work")).toBe("frustrated");
    expect(detectTone("I'm tired of calling about this")).toBe("frustrated");
  });

  test("detects confused tone", () => {
    expect(detectTone("I don't understand what you mean")).toBe("confused");
    expect(detectTone("What do you mean by that?")).toBe("confused");
    expect(detectTone("Huh?")).toBe("confused");
    expect(detectTone("I'm not sure I follow")).toBe("confused");
  });

  test("detects urgent tone", () => {
    expect(detectTone("This is an emergency")).toBe("urgent");
    expect(detectTone("I need help right now")).toBe("urgent");
    expect(detectTone("Please handle this ASAP")).toBe("urgent");
    expect(detectTone("I need this resolved immediately")).toBe("urgent");
  });

  test("detects friendly tone", () => {
    expect(detectTone("Thanks so much for your help")).toBe("friendly");
    expect(detectTone("You've been great, I appreciate it")).toBe("friendly");
    expect(detectTone("I really appreciate your help")).toBe("friendly");
  });

  test("returns neutral for ordinary speech", () => {
    expect(detectTone("I'd like to schedule an appointment")).toBe("neutral");
    expect(detectTone("What are your business hours")).toBe("neutral");
    expect(detectTone("Can I get a quote")).toBe("neutral");
  });
});

describe("getToneInstruction", () => {
  test("returns empty string for neutral", () => {
    expect(getToneInstruction("neutral")).toBe("");
  });

  test("returns non-empty string for frustrated", () => {
    const instruction = getToneInstruction("frustrated");
    expect(instruction.length).toBeGreaterThan(0);
    expect(instruction).toContain("frustrated");
  });

  test("returns non-empty string for confused", () => {
    const instruction = getToneInstruction("confused");
    expect(instruction.length).toBeGreaterThan(0);
    expect(instruction).toContain("confused");
  });

  test("returns non-empty string for urgent", () => {
    const instruction = getToneInstruction("urgent");
    expect(instruction.length).toBeGreaterThan(0);
    expect(instruction).toContain("urgent");
  });

  test("returns non-empty string for friendly", () => {
    const instruction = getToneInstruction("friendly");
    expect(instruction.length).toBeGreaterThan(0);
    expect(instruction).toContain("friendly");
  });
});
