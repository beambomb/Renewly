import { diffDays, type CalendarDate } from "@/lib/dates/calendar";

/** Suggest a new estimate only once there are this many purchases. */
export const MIN_PURCHASES_FOR_SUGGESTION = 3;
/** ...and only when the real average differs from the estimate by at least this much. */
export const SUGGESTION_DIFFERENCE = 0.1;

/** Days between consecutive distinct purchase dates, oldest first. */
export function purchaseIntervals(dates: readonly CalendarDate[]): number[] {
  const sorted = [...new Set(dates)].sort();
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(diffDays(sorted[i - 1] as CalendarDate, sorted[i] as CalendarDate));
  }
  return intervals;
}

/** Mean real interval in days, or null when there are fewer than 3 distinct purchases. */
export function averageIntervalDays(dates: readonly CalendarDate[]): number | null {
  const intervals = purchaseIntervals(dates);
  if (intervals.length + 1 < MIN_PURCHASES_FOR_SUGGESTION) return null;
  const sum = intervals.reduce((total, n) => total + n, 0);
  return sum / intervals.length;
}

export interface EstimateSuggestion {
  currentDays: number;
  averageDays: number;
  suggestedDays: number;
  purchases: number;
}

/**
 * Suggests updating the estimated duration. Never applies it: the caller shows
 * the suggestion and the user accepts or dismisses it.
 */
export function suggestEstimate(
  dates: readonly CalendarDate[],
  currentDays: number,
): EstimateSuggestion | null {
  const average = averageIntervalDays(dates);
  if (average === null || currentDays < 1) return null;
  const suggestedDays = Math.max(1, Math.round(average));
  const difference = Math.abs(suggestedDays - currentDays) / currentDays;
  if (suggestedDays === currentDays || difference < SUGGESTION_DIFFERENCE) return null;
  return {
    currentDays,
    averageDays: Math.round(average * 10) / 10,
    suggestedDays,
    purchases: new Set(dates).size,
  };
}
