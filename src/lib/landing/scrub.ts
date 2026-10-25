/** Pure maths for the draggable hero ring. No DOM: every input is explicit. */

export const SCRUB_CYCLE_DAYS = 30;
const DEGREES_PER_DAY = 360 / SCRUB_CYCLE_DAYS;
/** Matches the arc radius in LandingRing's 100-unit box. */
const RING_RADIUS = 44;

export function clampDays(days: number): number {
  return Math.min(Math.max(Math.round(days), 0), SCRUB_CYCLE_DAYS);
}

/** Degrees clockwise from 12 o'clock, in [0, 360). dx and dy are pointer minus ring centre. */
export function pointerAngle(dx: number, dy: number): number {
  const degrees = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return (degrees + 360) % 360;
}

/**
 * Tracks whole turns so the value cannot wrap: crossing 12 o'clock adds or removes a turn
 * and the result is clamped, so it sticks at 0 or 30 until the pointer comes back.
 */
export interface ScrubTrack {
  turns: number;
  last: number;
  /** Keeps a grabbed handle from jumping to the pointer's exact angle. */
  offset: number;
}

/** `grabbedDays` is the current value when the handle itself is grabbed, null for a click on the track. */
export function startTrack(angle: number, grabbedDays: number | null): ScrubTrack {
  if (grabbedDays === null) return { turns: 0, last: angle, offset: 0 };
  const target = grabbedDays * DEGREES_PER_DAY;
  const turns = Math.round((target - angle) / 360);
  return { turns, last: angle, offset: target - (angle + 360 * turns) };
}

export function advanceTrack(track: ScrubTrack, angle: number): ScrubTrack {
  const delta = angle - track.last;
  const turns = delta < -180 ? track.turns + 1 : delta > 180 ? track.turns - 1 : track.turns;
  return { ...track, turns, last: angle };
}

export function trackDays(track: ScrubTrack): number {
  return clampDays((track.last + 360 * track.turns + track.offset) / DEGREES_PER_DAY);
}

/** Where the arc ends, as percentages of the ring box (arc runs clockwise from 12 o'clock). */
export function handlePoint(days: number): { x: number; y: number } {
  const radians = (clampDays(days) / SCRUB_CYCLE_DAYS) * 2 * Math.PI;
  const round = (n: number) => Math.round(n * 100) / 100;
  return { x: round(50 + RING_RADIUS * Math.sin(radians)), y: round(50 - RING_RADIUS * Math.cos(radians)) };
}

/** Slider keys. Returns null for keys the slider ignores. */
export function stepDays(days: number, key: string): number | null {
  switch (key) {
    case "ArrowLeft":
    case "ArrowDown":
      return clampDays(days - 1);
    case "ArrowRight":
    case "ArrowUp":
      return clampDays(days + 1);
    case "PageDown":
      return clampDays(days - 7);
    case "PageUp":
      return clampDays(days + 7);
    case "Home":
      return 0;
    case "End":
      return SCRUB_CYCLE_DAYS;
    default:
      return null;
  }
}
