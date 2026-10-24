/**
 * Calendar-date arithmetic on plain `YYYY-MM-DD` strings.
 *
 * Dates here are calendar days, not instants, so daylight-saving shifts cannot
 * create 23 or 25 hour errors. Only converting an instant to the user's local
 * calendar day (`todayIn`) involves a time zone.
 */

/** A calendar date formatted as YYYY-MM-DD. */
export type CalendarDate = string;

export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function parseDate(date: CalendarDate): DateParts {
  const match = DATE_PATTERN.exec(date);
  if (!match) throw new RangeError(`Invalid calendar date: ${date}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError(`Invalid calendar date: ${date}`);
  }
  return { year, month, day };
}

export function isValidDate(date: string): boolean {
  try {
    parseDate(date);
    return true;
  } catch {
    return false;
  }
}

export function formatDate({ year, month, day }: DateParts): CalendarDate {
  const y = String(year).padStart(4, "0");
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Days since 1970-01-01 for a calendar date. */
export function toEpochDay(date: CalendarDate): number {
  const { year, month, day } = parseDate(date);
  return Math.round(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

export function fromEpochDay(epochDay: number): CalendarDate {
  const d = new Date(epochDay * MS_PER_DAY);
  return formatDate({
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  });
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function diffDays(from: CalendarDate, to: CalendarDate): number {
  return toEpochDay(to) - toEpochDay(from);
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return fromEpochDay(toEpochDay(date) + days);
}

/**
 * Adds whole months. The day of month is `anchorDay` (default: the date's own
 * day) clamped to the length of the target month, so 31 Jan + 1 month is 28/29
 * Feb, and the anchor is kept for later months (31 Jan -> 28 Feb -> 31 Mar).
 */
export function addMonths(date: CalendarDate, months: number, anchorDay?: number): CalendarDate {
  const { year, month, day } = parseDate(date);
  const wanted = anchorDay ?? day;
  const index = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(index / 12);
  const targetMonth = (index % 12 + 12) % 12 + 1;
  return formatDate({
    year: targetYear,
    month: targetMonth,
    day: Math.min(wanted, daysInMonth(targetYear, targetMonth)),
  });
}

/** Adds whole years; 29 Feb becomes 28 Feb in non-leap years. */
export function addYears(date: CalendarDate, years: number, anchorDay?: number): CalendarDate {
  return addMonths(date, years * 12, anchorDay);
}

export function compareDates(a: CalendarDate, b: CalendarDate): number {
  return toEpochDay(a) - toEpochDay(b);
}

/** "24 Oct 2026" for display. Calendar dates carry no time zone, so format in UTC. */
export function formatDisplayDate(date: CalendarDate, locale = "en-GB"): string {
  const { year, month, day } = parseDate(date);
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

function localParts(timeZone: string, now: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hourCycle: "h23",
  });
  const parts: Record<string, number> = {};
  for (const part of formatter.formatToParts(now)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return parts as { year: number; month: number; day: number; hour: number };
}

/** The calendar date it currently is for someone in `timeZone`. */
export function todayIn(timeZone: string, now: Date): CalendarDate {
  const { year, month, day } = localParts(timeZone, now);
  return formatDate({ year, month, day });
}

/** The local hour (0-23) for someone in `timeZone`. */
export function localHourIn(timeZone: string, now: Date): number {
  return localParts(timeZone, now).hour;
}
