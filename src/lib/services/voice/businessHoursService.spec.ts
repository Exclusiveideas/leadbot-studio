import { describe, expect, test } from "vitest";
import {
  parseBusinessHours,
  isWithinBusinessHours,
} from "./businessHoursService";

describe("parseBusinessHours", () => {
  test("returns null for null/undefined input", () => {
    expect(parseBusinessHours(null)).toBeNull();
    expect(parseBusinessHours(undefined)).toBeNull();
  });

  test("returns null for missing timezone", () => {
    expect(
      parseBusinessHours({
        schedule: { mon: { start: "09:00", end: "17:00" } },
      }),
    ).toBeNull();
  });

  test("returns null for invalid timezone", () => {
    expect(
      parseBusinessHours({
        timezone: "Fake/Zone",
        schedule: { mon: { start: "09:00", end: "17:00" } },
      }),
    ).toBeNull();
  });

  test("returns null for missing schedule", () => {
    expect(parseBusinessHours({ timezone: "America/New_York" })).toBeNull();
  });

  test("parses valid business hours", () => {
    const input = {
      timezone: "America/New_York",
      schedule: {
        mon: { start: "09:00", end: "17:00" },
        tue: { start: "09:00", end: "17:00" },
      },
    };

    expect(parseBusinessHours(input)).toEqual(input);
  });

  test("skips invalid day entries", () => {
    const input = {
      timezone: "UTC",
      schedule: {
        mon: { start: "09:00", end: "17:00" },
        tue: { start: "invalid", end: "17:00" },
        xyz: { start: "09:00", end: "17:00" },
      },
    };

    expect(parseBusinessHours(input)).toEqual({
      timezone: "UTC",
      schedule: {
        mon: { start: "09:00", end: "17:00" },
      },
    });
  });

  test("validates time format strictly", () => {
    expect(
      parseBusinessHours({
        timezone: "UTC",
        schedule: { mon: { start: "9:00", end: "17:00" } },
      }),
    ).toEqual({ timezone: "UTC", schedule: {} });

    expect(
      parseBusinessHours({
        timezone: "UTC",
        schedule: { mon: { start: "25:00", end: "17:00" } },
      }),
    ).toEqual({ timezone: "UTC", schedule: {} });
  });
});

describe("isWithinBusinessHours", () => {
  const standardHours = {
    timezone: "UTC",
    schedule: {
      mon: { start: "09:00", end: "17:00" },
      tue: { start: "09:00", end: "17:00" },
      wed: { start: "09:00", end: "17:00" },
      thu: { start: "09:00", end: "17:00" },
      fri: { start: "09:00", end: "17:00" },
    },
  };

  test("returns true during business hours", () => {
    // Monday 12:00 UTC
    const monday = new Date("2026-02-23T12:00:00Z");
    expect(isWithinBusinessHours(standardHours, monday)).toBe(true);
  });

  test("returns false before business hours", () => {
    // Monday 08:00 UTC
    const earlyMon = new Date("2026-02-23T08:00:00Z");
    expect(isWithinBusinessHours(standardHours, earlyMon)).toBe(false);
  });

  test("returns false after business hours", () => {
    // Monday 18:00 UTC
    const lateMon = new Date("2026-02-23T18:00:00Z");
    expect(isWithinBusinessHours(standardHours, lateMon)).toBe(false);
  });

  test("returns false on days not in schedule (weekend)", () => {
    // Saturday 12:00 UTC
    const saturday = new Date("2026-02-28T12:00:00Z");
    expect(isWithinBusinessHours(standardHours, saturday)).toBe(false);
  });

  test("returns false at exactly end time (exclusive)", () => {
    // Monday 17:00 UTC exactly
    const endTime = new Date("2026-02-23T17:00:00Z");
    expect(isWithinBusinessHours(standardHours, endTime)).toBe(false);
  });

  test("returns true at exactly start time (inclusive)", () => {
    // Monday 09:00 UTC exactly
    const startTime = new Date("2026-02-23T09:00:00Z");
    expect(isWithinBusinessHours(standardHours, startTime)).toBe(true);
  });

  test("respects timezone conversion", () => {
    const nyHours = {
      timezone: "America/New_York",
      schedule: {
        mon: { start: "09:00", end: "17:00" },
      },
    };

    // Monday 14:00 UTC = Monday 09:00 EST (within hours)
    const inHours = new Date("2026-02-23T14:00:00Z");
    expect(isWithinBusinessHours(nyHours, inHours)).toBe(true);

    // Monday 13:00 UTC = Monday 08:00 EST (before hours)
    const beforeHours = new Date("2026-02-23T13:00:00Z");
    expect(isWithinBusinessHours(nyHours, beforeHours)).toBe(false);
  });
});
