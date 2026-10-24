import { diffDays, type CalendarDate } from "@/lib/dates/calendar";
import { strings } from "@/lib/strings";

export type ItemKind = "subscription" | "recurring" | "warranty";
export type ItemStatus = "active" | "paused" | "cancelled";
export type RingState = "comfortable" | "soon" | "urgent" | "overdue" | "inactive";

/** A ring is "soon" at or below this fraction of the period left. */
export const SOON_THRESHOLD = 0.3;
/** A ring is "urgent" at or below this many days left. */
export const URGENT_DAYS = 3;

export interface RingInput {
  kind: ItemKind;
  status: ItemStatus;
  name: string;
  /** Start of the current period (previous billing date, last purchase, purchase date). */
  periodStart: CalendarDate;
  /** Next renewal, next purchase or warranty expiry. */
  dueDate: CalendarDate;
}

export interface RingViewModel {
  state: RingState;
  /** Fraction of the period still left, 0 to 1. This is how full the ring is. */
  fractionLeft: number;
  percentLeft: number;
  /** Whole days until due. Negative when overdue, 0 on the due day. */
  daysLeft: number;
  totalDays: number;
  /** Visible text such as "12 days left" or "Overdue by 3 days". */
  label: string;
  /** Short state name shown beside the glyph, never colour alone. */
  stateLabel: string;
  ariaLabel: string;
}

function labelFor(input: RingInput, daysLeft: number): string {
  if (input.status === "paused") return strings.ring.paused;
  if (input.status === "cancelled") return strings.ring.cancelled;

  const isWarranty = input.kind === "warranty";
  if (daysLeft < 0) {
    return isWarranty
      ? strings.ring.expiredAgo(-daysLeft)
      : strings.ring.overdueBy(-daysLeft);
  }
  if (daysLeft === 0) return isWarranty ? strings.ring.expiresToday : strings.ring.dueToday;
  if (daysLeft === 1) return strings.ring.oneDayLeft;
  return strings.ring.daysLeft(daysLeft);
}

export function computeRing(input: RingInput, today: CalendarDate): RingViewModel {
  const totalDays = Math.max(1, diffDays(input.periodStart, input.dueDate));
  const daysLeft = diffDays(today, input.dueDate);
  const fractionLeft = Math.min(1, Math.max(0, daysLeft / totalDays));
  const percentLeft = Math.round(fractionLeft * 100);

  let state: RingState;
  if (input.status !== "active") state = "inactive";
  else if (daysLeft < 0) state = "overdue";
  else if (daysLeft <= URGENT_DAYS) state = "urgent";
  else if (fractionLeft <= SOON_THRESHOLD) state = "soon";
  else state = "comfortable";

  const label = labelFor(input, daysLeft);
  const stateLabel = strings.ring.state[state];
  const ariaLabel =
    state === "inactive"
      ? strings.ring.ariaInactive(input.name, label)
      : strings.ring.aria(input.name, label, percentLeft, stateLabel);

  return { state, fractionLeft, percentLeft, daysLeft, totalDays, label, stateLabel, ariaLabel };
}

/** Lower sorts first: overdue, then least time left; paused and cancelled last. */
export function urgencyRank(vm: Pick<RingViewModel, "state" | "daysLeft">): number {
  if (vm.state === "inactive") return Number.MAX_SAFE_INTEGER;
  return vm.daysLeft;
}
