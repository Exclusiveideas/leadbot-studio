import { describe, expect, test } from "vitest";
import { toChatbotLeadFormId } from "./branded";

describe("toChatbotLeadFormId", () => {
  test("converts valid string to ChatbotLeadFormId", () => {
    const id = "form_123";
    expect(toChatbotLeadFormId(id)).toBe(id);
  });

  test("throws error for empty string", () => {
    expect(() => toChatbotLeadFormId("")).toThrow(
      "Invalid chatbot lead form ID"
    );
  });

  test("throws error for null", () => {
    expect(() => toChatbotLeadFormId(null as any)).toThrow(
      "Invalid chatbot lead form ID"
    );
  });

  test("throws error for undefined", () => {
    expect(() => toChatbotLeadFormId(undefined as any)).toThrow(
      "Invalid chatbot lead form ID"
    );
  });

  test("converts cuid format string", () => {
    const cuid = "clxyz123abc456def789";
    expect(toChatbotLeadFormId(cuid)).toBe(cuid);
  });
});
