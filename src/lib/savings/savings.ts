import { diffDays, type CalendarDate } from "@/lib/dates/calendar";
import { DAYS_PER_MONTH, formatMoney } from "@/lib/money/money";
import { strings } from "@/lib/strings";

export type SavingsState = "in_progress" | "completed" | "overdue";

export interface SavingsInput {
  /** Amounts in the currency's minor units. */
  targetMinor: number;
  savedMinor: number;
  /** Optional target date. */
  deadline: CalendarDate | null;
}

export interface SavingsProgress {
  state: SavingsState;
  /** 0 to 1, how full the progress bar is. */
  fraction: number;
  /** Whole percent, rounded down so 99.9% never reads as 100%. */
  percent: number;
  savedMinor: number;
  targetMinor: number;
  remainingMinor: number;
  completed: boolean;
  /** Days to the deadline (negative once passed), or null without a deadline. */
  daysToDeadline: number | null;
  /** Amount to set aside each month to finish by the deadline, or null. */
  neededPerMonthMinor: number | null;
}

export function computeSavings(input: SavingsInput, today: CalendarDate): SavingsProgress {
  const { targetMinor, savedMinor, deadline } = input;
  if (!Number.isFinite(targetMinor) || targetMinor <= 0) {
    throw new RangeError("Savings target must be above 0");
  }
  const saved = Math.max(0, savedMinor);
  const completed = saved >= targetMinor;
  const fraction = Math.min(1, saved / targetMinor);
  const percent = completed ? 100 : Math.floor(fraction * 100);
  const remainingMinor = Math.max(0, targetMinor - saved);

  const daysToDeadline = deadline === null ? null : diffDays(today, deadline);

  let neededPerMonthMinor: number | null = null;
  if (daysToDeadline !== null && daysToDeadline >= 0 && !completed) {
    const monthsLeft = Math.max(1, Math.ceil(daysToDeadline / DAYS_PER_MONTH));
    neededPerMonthMinor = Math.ceil(remainingMinor / monthsLeft);
  }

  let state: SavingsState = "in_progress";
  if (completed) state = "completed";
  else if (daysToDeadline !== null && daysToDeadline < 0) state = "overdue";

  return {
    state,
    fraction,
    percent,
    savedMinor: saved,
    targetMinor,
    remainingMinor,
    completed,
    daysToDeadline,
    neededPerMonthMinor,
  };
}

/** True when taking out `amountMinor` would leave the total at 0 or more. */
export function canWithdraw(savedMinor: number, amountMinor: number): boolean {
  return Number.isInteger(amountMinor) && amountMinor > 0 && amountMinor <= savedMinor;
}

/** The signed adjustment that makes the total equal `newTotalMinor`. */
export function adjustmentFor(savedMinor: number, newTotalMinor: number): number {
  if (!Number.isInteger(newTotalMinor) || newTotalMinor < 0) {
    throw new RangeError("The corrected total must be a whole number of 0 or more");
  }
  return newTotalMinor - savedMinor;
}

/** Deadline line such as "92 days to the deadline" or "Deadline passed 3 days ago". */
export function deadlineText(daysToDeadline: number | null): string {
  if (daysToDeadline === null) return strings.savings.noDeadline;
  if (daysToDeadline < 0) return strings.savings.deadlinePassed(-daysToDeadline);
  if (daysToDeadline === 0) return strings.savings.deadlineToday;
  return strings.savings.deadlineInDays(daysToDeadline);
}

export function savingsAriaLabel(name: string, progress: SavingsProgress, currency: string): string {
  return strings.savings.aria(
    name,
    progress.percent,
    formatMoney(progress.savedMinor, currency),
    formatMoney(progress.targetMinor, currency),
    strings.savings.state[progress.state],
  );
}
