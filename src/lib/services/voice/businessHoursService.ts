type DayAbbr = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type DaySchedule = {
  start: string;
  end: string;
};

type BusinessHours = {
  timezone: string;
  schedule: Partial<Record<DayAbbr, DaySchedule>>;
};

const VALID_DAYS: DayAbbr[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const JS_DAY_TO_ABBR: Record<number, DayAbbr> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

export function parseBusinessHours(raw: unknown): BusinessHours | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;
  if (typeof obj.timezone !== "string" || !obj.timezone) return null;

  try {
    Intl.DateTimeFormat(undefined, { timeZone: obj.timezone });
  } catch {
    return null;
  }

  if (!obj.schedule || typeof obj.schedule !== "object") return null;

  const schedule: Partial<Record<DayAbbr, DaySchedule>> = {};
  const scheduleObj = obj.schedule as Record<string, unknown>;

  for (const key of Object.keys(scheduleObj)) {
    if (!VALID_DAYS.includes(key as DayAbbr)) continue;

    const day = scheduleObj[key];
    if (!day || typeof day !== "object") continue;

    const dayObj = day as Record<string, unknown>;
    if (
      typeof dayObj.start !== "string" ||
      typeof dayObj.end !== "string" ||
      !TIME_REGEX.test(dayObj.start) ||
      !TIME_REGEX.test(dayObj.end)
    ) {
      continue;
    }

    schedule[key as DayAbbr] = {
      start: dayObj.start,
      end: dayObj.end,
    };
  }

  return {
    timezone: obj.timezone,
    schedule,
  };
}

export function isWithinBusinessHours(
  businessHours: BusinessHours,
  now: Date = new Date(),
): boolean {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: businessHours.timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value?.toLowerCase();
  const hour = parts.find((p) => p.type === "hour")?.value;
  const minute = parts.find((p) => p.type === "minute")?.value;

  if (!weekday || !hour || !minute) return true;

  const dayMap: Record<string, DayAbbr> = {
    mon: "mon",
    tue: "tue",
    wed: "wed",
    thu: "thu",
    fri: "fri",
    sat: "sat",
    sun: "sun",
  };

  const dayAbbr = dayMap[weekday];
  if (!dayAbbr) return true;

  const daySchedule = businessHours.schedule[dayAbbr];
  if (!daySchedule) return false;

  const currentTime = `${hour}:${minute}`;
  return currentTime >= daySchedule.start && currentTime < daySchedule.end;
}

export type { BusinessHours, DayAbbr, DaySchedule };
