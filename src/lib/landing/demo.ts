import { strings } from "@/lib/strings";

export type DemoState = "comfortable" | "soon" | "urgent";

/** Mirrors SOON_THRESHOLD and URGENT_DAYS in src/lib/rings/ring.ts. */
const SOON_THRESHOLD = 0.3;
const URGENT_DAYS = 3;

export interface DemoRing {
  name: string;
  state: DemoState;
  fraction: number;
  daysLeft: number;
  label: string;
  stateLabel: string;
  ariaLabel: string;
}

/** Dash offset for a ring drawn with pathLength=100: full arc is 0, empty is 100. */
export function ringOffset(fraction: number): number {
  return Math.round((100 - 100 * fraction) * 100) / 100;
}

export function daysLabel(daysLeft: number): string {
  if (daysLeft === 0) return strings.ring.dueToday;
  if (daysLeft === 1) return strings.ring.oneDayLeft;
  return strings.ring.daysLeft(daysLeft);
}

export function stateFor(daysLeft: number, cycleDays: number): DemoState {
  if (daysLeft <= URGENT_DAYS) return "urgent";
  if (daysLeft / cycleDays <= SOON_THRESHOLD) return "soon";
  return "comfortable";
}

/** Fixed demo data: no clock, so server and client always render the same thing. */
export function demoRing(name: string, daysLeft: number, cycleDays: number): DemoRing {
  const fraction = daysLeft / cycleDays;
  const state = stateFor(daysLeft, cycleDays);
  const label = daysLabel(daysLeft);
  const stateLabel = strings.ring.state[state];
  return {
    name,
    state,
    fraction,
    daysLeft,
    label,
    stateLabel,
    ariaLabel: strings.ring.aria(name, label, Math.round(fraction * 100), stateLabel),
  };
}

export const DEMO_HERO = demoRing(strings.landing.demo.subscription, 3, 30);
export const DEMO_SATELLITES = [
  demoRing(strings.landing.demo.recurring, 6, 30),
  demoRing(strings.landing.demo.warranty, 410, 730),
] as const;
export const DEMO_TRACKS = {
  subscription: demoRing(strings.landing.demo.subscription, 12, 30),
  recurring: demoRing(strings.landing.demo.recurring, 6, 30),
  warranty: demoRing(strings.landing.demo.warranty, 410, 730),
} as const;
export const DEMO_STOPS = {
  week: demoRing(strings.landing.demo.subscription, 7, 30),
  soon: demoRing(strings.landing.demo.subscription, 3, 30),
  day: demoRing(strings.landing.demo.subscription, 0, 30),
} as const;
