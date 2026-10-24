import {
  billingDateAt,
  firstIndexOnOrAfter,
  type BillingSchedule,
} from "@/lib/dates/billing";
import { addDays, type CalendarDate } from "@/lib/dates/calendar";
import type { BillingCycle } from "./types";

export interface RepeatingReminder {
  repeat: BillingCycle;
  cycleDays: number | null;
  billingAnchorDay: number | null;
  /** The occurrence currently shown (it may be in the past). */
  dueDate: CalendarDate;
}

export interface NextOccurrence {
  periodStart: CalendarDate;
  dueDate: CalendarDate;
}

/**
 * Where a repeating reminder goes when it is marked done: the first occurrence
 * strictly after both today and its current date. So marking rent done on the
 * due day moves it a month ahead, and a reminder that was missed for months
 * lands on the next future date rather than a stale one.
 */
export function advanceReminder(reminder: RepeatingReminder, today: CalendarDate): NextOccurrence {
  const schedule: BillingSchedule = {
    cycle: reminder.repeat,
    cycleDays: reminder.cycleDays,
    anchor: reminder.dueDate,
    anchorDay: reminder.billingAnchorDay,
  };
  const earliest = addDays(today > reminder.dueDate ? today : reminder.dueDate, 1);
  const n = firstIndexOnOrAfter(schedule, earliest);
  return { periodStart: billingDateAt(schedule, n - 1), dueDate: billingDateAt(schedule, n) };
}
