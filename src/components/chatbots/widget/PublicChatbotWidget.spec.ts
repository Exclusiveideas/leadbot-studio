import { describe, expect, test } from "vitest";
import type { BookingConfig } from "@/lib/validation/chatbot-booking";
import type { TextConfig } from "@/lib/validation/chatbot-text";

/**
 * Feature detection logic extracted for testing.
 * These mirror the logic in PublicChatbotWidget.tsx
 */
function isBookingEnabled(bookingConfig: BookingConfig | null): boolean {
  return (
    !!bookingConfig?.enabled &&
    (bookingConfig.categories?.length ?? 0) > 0 &&
    (bookingConfig.locations?.length ?? 0) > 0
  );
}

function isTextEnabled(textConfig: TextConfig | null): boolean {
  return textConfig?.enabled === true;
}

function hasMultipleActions(
  bookingConfig: BookingConfig | null,
  textConfig: TextConfig | null,
): boolean {
  return isBookingEnabled(bookingConfig) || isTextEnabled(textConfig);
}

const validBookingConfig: BookingConfig = {
  enabled: true,
  categories: [{ id: "cat-1", name: "Category 1" }],
  locations: [
    {
      id: "loc-1",
      name: "Location 1",
      address: "123 Test St",
      availableDays: ["monday", "tuesday"],
      timeSlots: [{ start: "09:00", end: "17:00" }],
    },
  ],
  requireCaseDescription: false,
};

const validTextConfig: TextConfig = {
  enabled: true,
  consentText: "By submitting, you agree to receive texts.",
  fields: {
    firstName: { required: true },
    lastName: { required: true },
    phone: { required: true },
    email: { enabled: true, required: false },
    message: { required: true },
  },
};

describe("isBookingEnabled", () => {
  test("returns true when all conditions are met", () => {
    expect(isBookingEnabled(validBookingConfig)).toBe(true);
  });

  test("returns false when config is null", () => {
    expect(isBookingEnabled(null)).toBe(false);
  });

  test("returns false when enabled is false", () => {
    expect(isBookingEnabled({ ...validBookingConfig, enabled: false })).toBe(
      false,
    );
  });

  test("returns false when categories is empty", () => {
    expect(isBookingEnabled({ ...validBookingConfig, categories: [] })).toBe(
      false,
    );
  });

  test("returns false when locations is empty", () => {
    expect(isBookingEnabled({ ...validBookingConfig, locations: [] })).toBe(
      false,
    );
  });

  test("returns false when categories is undefined", () => {
    const config = { ...validBookingConfig };
    // @ts-expect-error testing undefined case
    delete config.categories;
    expect(isBookingEnabled(config)).toBe(false);
  });
});

describe("isTextEnabled", () => {
  test("returns true when enabled is true", () => {
    expect(isTextEnabled(validTextConfig)).toBe(true);
  });

  test("returns false when config is null", () => {
    expect(isTextEnabled(null)).toBe(false);
  });

  test("returns false when enabled is false", () => {
    expect(isTextEnabled({ ...validTextConfig, enabled: false })).toBe(false);
  });

  test("returns false when enabled is undefined", () => {
    const config = { ...validTextConfig };
    // @ts-expect-error testing undefined case
    delete config.enabled;
    expect(isTextEnabled(config)).toBe(false);
  });
});

describe("hasMultipleActions", () => {
  test("returns true when both booking and text are enabled", () => {
    expect(hasMultipleActions(validBookingConfig, validTextConfig)).toBe(true);
  });

  test("returns true when only booking is enabled", () => {
    expect(hasMultipleActions(validBookingConfig, null)).toBe(true);
  });

  test("returns true when only text is enabled", () => {
    expect(hasMultipleActions(null, validTextConfig)).toBe(true);
  });

  test("returns false when neither is enabled", () => {
    expect(hasMultipleActions(null, null)).toBe(false);
  });

  test("returns false when booking enabled=false and text is null", () => {
    expect(
      hasMultipleActions({ ...validBookingConfig, enabled: false }, null),
    ).toBe(false);
  });

  test("returns false when text enabled=false and booking is null", () => {
    expect(
      hasMultipleActions(null, { ...validTextConfig, enabled: false }),
    ).toBe(false);
  });
});
