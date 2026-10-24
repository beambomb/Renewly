import { diffDays, localHourIn, todayIn, type CalendarDate } from "@/lib/dates/calendar";
import type { ItemStatus } from "@/lib/rings/ring";

export type ReminderChannel = "in_app" | "email" | "push";
export type ReminderType = "upcoming" | "due" | "overdue";

/** offset_days value used in the log for the single "overdue" notification. */
export const OVERDUE_OFFSET = -1;
/** Default local hour from which reminders are sent. */
export const DEFAULT_SEND_HOUR = 8;
/** Overdue notices are only sent within this many days after the due date. */
export const OVERDUE_WINDOW_DAYS = 30;
export const DEFAULT_OFFSETS: readonly number[] = [7, 3, 1, 0];

export interface PlannableItem {
  id: string;
  status: ItemStatus;
  dueDate: CalendarDate;
  /** null means use the profile default. */
  reminderOffsets: readonly number[] | null;
}

export interface PlannedReminder {
  itemId: string;
  dueDate: CalendarDate;
  offsetDays: number;
  channel: ReminderChannel;
  type: ReminderType;
}

export interface PlanOptions {
  now: Date;
  /** The user's IANA time zone. */
  timeZone: string;
  profileOffsets: readonly number[];
  /** Enabled channels for this user. */
  channels: readonly ReminderChannel[];
  /** Send from this local hour onward (so a late run still catches up the same day). */
  sendHour?: number;
  /** Keys (see reminderKey) already present in reminder_log. */
  alreadyLogged?: ReadonlySet<string>;
  overdueWindowDays?: number;
}

export function reminderKey(
  itemId: string,
  dueDate: CalendarDate,
  offsetDays: number,
  channel: ReminderChannel,
): string {
  return `${itemId}|${dueDate}|${offsetDays}|${channel}`;
}

/** Item offsets if set, otherwise the profile default; whole numbers, unique, nearest first. */
export function effectiveOffsets(
  item: Pick<PlannableItem, "reminderOffsets">,
  profileOffsets: readonly number[],
): number[] {
  const source = item.reminderOffsets ?? profileOffsets;
  return [...new Set(source.filter((n) => Number.isInteger(n) && n >= 0))].sort((a, b) => a - b);
}

export function isSendTime(now: Date, timeZone: string, sendHour = DEFAULT_SEND_HOUR): boolean {
  return localHourIn(timeZone, now) >= sendHour;
}

/**
 * Decides which reminders should go out right now for one user. Pure: no
 * database access. The caller still claims each entry in reminder_log before
 * sending, so running this repeatedly (retries, restarts, overlapping runs)
 * never sends the same reminder twice.
 *
 * Rules:
 * - Only active items. Paused and cancelled items get nothing.
 * - An offset fires on the day `dueDate - offset` in the user's time zone
 *   (offset 0 is the due day). Offsets in the past are never back-filled.
 * - One "overdue" notice per due date, for up to OVERDUE_WINDOW_DAYS after it.
 */
export function planReminders(
  items: readonly PlannableItem[],
  options: PlanOptions,
): PlannedReminder[] {
  const {
    now,
    timeZone,
    profileOffsets,
    channels,
    sendHour = DEFAULT_SEND_HOUR,
    alreadyLogged,
    overdueWindowDays = OVERDUE_WINDOW_DAYS,
  } = options;

  if (!isSendTime(now, timeZone, sendHour)) return [];

  const today = todayIn(timeZone, now);
  const planned: PlannedReminder[] = [];

  const push = (item: PlannableItem, offsetDays: number, type: ReminderType) => {
    for (const channel of channels) {
      const key = reminderKey(item.id, item.dueDate, offsetDays, channel);
      if (alreadyLogged?.has(key)) continue;
      planned.push({ itemId: item.id, dueDate: item.dueDate, offsetDays, channel, type });
    }
  };

  for (const item of items) {
    if (item.status !== "active") continue;
    const daysLeft = diffDays(today, item.dueDate);

    if (daysLeft < 0) {
      if (-daysLeft <= overdueWindowDays) push(item, OVERDUE_OFFSET, "overdue");
      continue;
    }

    for (const offset of effectiveOffsets(item, profileOffsets)) {
      if (offset === daysLeft) push(item, offset, offset === 0 ? "due" : "upcoming");
    }
  }

  return planned;
}
