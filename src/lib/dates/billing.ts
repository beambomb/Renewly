import {
  addDays,
  addMonths,
  addYears,
  compareDates,
  diffDays,
  parseDate,
  type CalendarDate,
} from "./calendar";

export type BillingCycle = "weekly" | "monthly" | "yearly" | "custom";

/**
 * A recurring billing schedule. `anchor` is any known billing date (usually
 * the next billing date the user entered); every other occurrence is computed
 * from it, so a 31st-of-the-month schedule never drifts to the 28th.
 */
export interface BillingSchedule {
  cycle: BillingCycle;
  /** Required when cycle is "custom": bill every N days. */
  cycleDays?: number | null | undefined;
  anchor: CalendarDate;
  /**
   * The intended day of month for monthly and yearly cycles. Needed when the
   * anchor was clamped (for example the 31st stored as 28 Feb); defaults to
   * the anchor's own day.
   */
  anchorDay?: number | null | undefined;
}

export function stepDays(schedule: BillingSchedule): number | null {
  if (schedule.cycle === "weekly") return 7;
  if (schedule.cycle === "custom") {
    const n = schedule.cycleDays;
    if (!n || !Number.isInteger(n) || n < 1) {
      throw new RangeError("Custom billing cycle needs a whole number of days (1 or more)");
    }
    return n;
  }
  return null;
}

/** The n-th billing date relative to the anchor (n = 0 is the anchor, n < 0 earlier). */
export function billingDateAt(schedule: BillingSchedule, n: number): CalendarDate {
  const step = stepDays(schedule);
  if (step !== null) return addDays(schedule.anchor, step * n);
  const anchorDay = schedule.anchorDay ?? parseDate(schedule.anchor).day;
  if (schedule.cycle === "monthly") return addMonths(schedule.anchor, n, anchorDay);
  return addYears(schedule.anchor, n, anchorDay);
}

/** Smallest n whose billing date is on or after `date`. */
export function firstIndexOnOrAfter(schedule: BillingSchedule, date: CalendarDate): number {
  const step = stepDays(schedule);
  let n: number;
  if (step !== null) {
    n = Math.ceil(diffDays(schedule.anchor, date) / step);
  } else {
    const a = parseDate(schedule.anchor);
    const d = parseDate(date);
    const months = (d.year - a.year) * 12 + (d.month - a.month);
    n = schedule.cycle === "monthly" ? months : Math.floor(months / 12);
  }
  // The estimate can be off by one around month ends and leap days; settle it.
  while (compareDates(billingDateAt(schedule, n), date) < 0) n++;
  while (compareDates(billingDateAt(schedule, n - 1), date) >= 0) n--;
  return n;
}

/** The next billing date on or after `today` (today itself counts). */
export function nextBillingOnOrAfter(schedule: BillingSchedule, today: CalendarDate): CalendarDate {
  return billingDateAt(schedule, firstIndexOnOrAfter(schedule, today));
}

export interface BillingWindow {
  /** The billing date before `dueDate`: the start of the current ring period. */
  periodStart: CalendarDate;
  /** The next billing date on or after today. */
  dueDate: CalendarDate;
}

/** Current billing period around `today`, used for the ring and persisted on the item. */
export function billingWindow(schedule: BillingSchedule, today: CalendarDate): BillingWindow {
  const n = firstIndexOnOrAfter(schedule, today);
  return { periodStart: billingDateAt(schedule, n - 1), dueDate: billingDateAt(schedule, n) };
}

/**
 * Billing dates strictly after `after` and on or before `upTo`, oldest first.
 * Used to record missed auto-renewals.
 */
export function billingDatesBetween(
  schedule: BillingSchedule,
  after: CalendarDate,
  upTo: CalendarDate,
): CalendarDate[] {
  const dates: CalendarDate[] = [];
  let n = firstIndexOnOrAfter(schedule, after);
  if (billingDateAt(schedule, n) === after) n++;
  for (let guard = 0; guard < 10_000; guard++, n++) {
    const date = billingDateAt(schedule, n);
    if (compareDates(date, upTo) > 0) break;
    dates.push(date);
  }
  return dates;
}
