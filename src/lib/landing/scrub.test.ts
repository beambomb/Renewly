import { describe, expect, it } from "vitest";
import { advanceTrack, clampDays, handlePoint, pointerAngle, startTrack, stepDays, trackDays } from "./scrub";

describe("pointerAngle", () => {
  it("measures clockwise from 12 o'clock", () => {
    expect(pointerAngle(0, -10)).toBe(0);
    expect(pointerAngle(10, 0)).toBe(90);
    expect(pointerAngle(0, 10)).toBe(180);
    expect(pointerAngle(-10, 0)).toBe(270);
  });
});

describe("track", () => {
  const drag = (start: number | null, angles: number[]) => {
    const [first = 0, ...rest] = angles;
    let track = startTrack(first, start);
    for (const angle of rest) track = advanceTrack(track, angle);
    return trackDays(track);
  };

  it("maps a click on the track straight to days", () => {
    expect(drag(null, [180])).toBe(15);
    expect(drag(null, [90])).toBe(8);
    expect(drag(null, [270])).toBe(23);
  });

  it("keeps a grabbed handle where it is until the pointer moves", () => {
    expect(drag(3, [40])).toBe(3);
    expect(drag(30, [358])).toBe(30);
    expect(drag(0, [2])).toBe(0);
  });

  it("sticks at 30 when dragged clockwise past 12 o'clock", () => {
    expect(drag(30, [350, 355, 5, 40, 120])).toBe(30);
  });

  it("sticks at 0 when dragged counter-clockwise past 12 o'clock", () => {
    expect(drag(3, [36, 10, 355, 300, 200])).toBe(0);
  });

  it("returns from the end only once the pointer crosses back", () => {
    expect(drag(30, [350, 5, 90, 5, 330])).toBe(28);
  });
});

describe("handlePoint", () => {
  it("sits at the top for 0 and 30 and at the bottom for half", () => {
    expect(handlePoint(0)).toEqual({ x: 50, y: 6 });
    expect(handlePoint(30)).toEqual({ x: 50, y: 6 });
    expect(handlePoint(15)).toEqual({ x: 50, y: 94 });
  });
});

describe("stepDays", () => {
  it("steps and clamps", () => {
    expect(stepDays(3, "ArrowLeft")).toBe(2);
    expect(stepDays(3, "ArrowDown")).toBe(2);
    expect(stepDays(3, "ArrowRight")).toBe(4);
    expect(stepDays(3, "ArrowUp")).toBe(4);
    expect(stepDays(3, "PageDown")).toBe(0);
    expect(stepDays(25, "PageUp")).toBe(30);
    expect(stepDays(9, "Home")).toBe(0);
    expect(stepDays(9, "End")).toBe(30);
    expect(stepDays(9, "a")).toBeNull();
  });

  it("clamps days", () => {
    expect(clampDays(-4)).toBe(0);
    expect(clampDays(99)).toBe(30);
  });
});
