import { billingDateAt, billingWindow, type BillingSchedule } from "@/lib/dates/billing";
import { addDays, addMonths, parseDate, type CalendarDate } from "@/lib/dates/calendar";
import type { ItemInput } from "./types";

export interface DerivedColumns {
  /** Start of the current ring period; null only for a savings goal without a deadline. */
  period_start: CalendarDate | null;
  /** Next renewal, next purchase, expiry, reminder date or savings deadline. */
  due_date: CalendarDate | null;
  /** Kind-specific columns computed from the input. */
  extra: Record<string, unknown>;
}

interface Options {
  today: CalendarDate;
  /** Keep a one-off reminder's original start when editing it. */
  previousPeriodStart?: CalendarDate | null | undefined;
}

/** A one-off item's period starts today, or on its date when that is already past. */
function oneOffStart(date: CalendarDate, today: CalendarDate, previous?: CalendarDate | null): CalendarDate {
  const start = previous && previous <= date ? previous : today;
  return start <= date ? start : date;
}

function monthlyOrYearlyAnchorDay(cycle: string, anchor: CalendarDate): number | null {
  return cycle === "monthly" || cycle === "yearly" ? parseDate(anchor).day : null;
}

/**
 * Computes the dates that drive the ring (and the scheduler) for each section.
 * Pure: `today` is the user's local date.
 */
export function deriveColumns(input: ItemInput, options: Options): DerivedColumns {
  const { today } = options;

  switch (input.kind) {
    case "subscription": {
      const schedule: BillingSchedule = {
        cycle: input.billingCycle,
        cycleDays: input.cycleDays,
        anchor: input.nextBillingDate,
      };
      // The user entered the NEXT billing date, so it is the due date as given.
      // An auto-renewing subscription whose date already passed rolls forward.
      const rolled = input.autoRenew && input.nextBillingDate < today;
      const window = rolled
        ? billingWindow(schedule, today)
        : { periodStart: billingDateAt(schedule, -1), dueDate: input.nextBillingDate };
      return {
        period_start: window.periodStart,
        due_date: window.dueDate,
        extra: {
          billing_anchor_day: monthlyOrYearlyAnchorDay(input.billingCycle, input.nextBillingDate),
        },
      };
    }

    case "recurring":
      return {
        period_start: input.lastPurchasedOn,
        due_date: addDays(input.lastPurchasedOn, input.durationDays),
        extra: {},
      };

    case "warranty": {
      const expiresOn = addMonths(input.purchasedOn, input.warrantyMonths);
      return { period_start: input.purchasedOn, due_date: expiresOn, extra: { expires_on: expiresOn } };
    }

    case "reminder": {
      if (input.repeat === null) {
        return {
          period_start: oneOffStart(input.date, today, options.previousPeriodStart),
          due_date: input.date,
          extra: { billing_anchor_day: null },
        };
      }
      const schedule: BillingSchedule = { cycle: input.repeat, cycleDays: input.cycleDays, anchor: input.date };
      return {
        period_start: billingDateAt(schedule, -1),
        due_date: input.date,
        extra: { billing_anchor_day: monthlyOrYearlyAnchorDay(input.repeat, input.date) },
      };
    }

    case "savings": {
      if (input.deadline === null) return { period_start: null, due_date: null, extra: {} };
      return {
        period_start: oneOffStart(input.deadline, today, options.previousPeriodStart),
        due_date: input.deadline,
        extra: {},
      };
    }
  }
}
