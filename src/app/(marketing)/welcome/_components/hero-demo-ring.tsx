"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { Bell } from "lucide-react";
import { demoRing, DEMO_HERO } from "@/lib/landing/demo";
import { initialsOf } from "@/lib/initials";
import {
  advanceTrack,
  handlePoint,
  pointerAngle,
  SCRUB_CYCLE_DAYS,
  startTrack,
  stepDays,
  trackDays,
  type ScrubTrack,
} from "@/lib/landing/scrub";
import { strings } from "@/lib/strings";
import { LandingRing } from "./landing-ring";
import { StateLine } from "./state-line";

const copy = strings.landing.hero;
const REMINDER_DAYS = 3;
/** A touch that moves further than this is a scroll, not a tap on the track. */
const TAP_SLOP_PX = 10;

/**
 * The giant hero ring. Server-rendered in its FINAL state (3 days, urgent, chip shown) and
 * landing.css plays the intro over it. The first touch of the ring or keyboard sets
 * data-mode="manual", which cancels the intro, and `days` drives everything from then on.
 */
export function HeroDemoRing() {
  const [days, setDays] = useState(DEMO_HERO.daysLeft);
  const [manual, setManual] = useState(false);
  const [dragging, setDragging] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);
  const track = useRef<ScrubTrack | null>(null);
  const tap = useRef<{ id: number; x: number; y: number } | null>(null);

  useEffect(() => {
    // Without JS the handle and hint stay hidden; not React state, so no extra render.
    if (ringRef.current) ringRef.current.dataset.ready = "true";
  }, []);

  const ring = demoRing(DEMO_HERO.name, days, SCRUB_CYCLE_DAYS);
  const point = handlePoint(days);

  const angleOf = (event: PointerEvent) => {
    const rect = ringRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return pointerAngle(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2));
  };

  const set = (value: number) => {
    setManual(true);
    setDays(value);
  };

  const begin = (event: PointerEvent<HTMLElement | SVGElement>, grabbed: boolean) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // A finger on the track only taps (so the page keeps scrolling); dragging starts at the handle.
    if (!grabbed && event.pointerType === "touch") {
      tap.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    track.current = startTrack(angleOf(event), grabbed ? days : null);
    setDragging(true);
    set(trackDays(track.current));
  };

  const move = (event: PointerEvent) => {
    if (!track.current) return;
    track.current = advanceTrack(track.current, angleOf(event));
    setDays(trackDays(track.current));
  };

  const end = (event: PointerEvent) => {
    const pending = tap.current;
    tap.current = null;
    if (pending && pending.id === event.pointerId && event.type === "pointerup") {
      if (Math.hypot(event.clientX - pending.x, event.clientY - pending.y) <= TAP_SLOP_PX) {
        set(trackDays(startTrack(angleOf(event), null)));
      }
    }
    track.current = null;
    setDragging(false);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const next = stepDays(days, event.key);
    if (next === null) return;
    event.preventDefault();
    set(next);
  };

  const grab = { onPointerMove: move, onPointerUp: end, onPointerCancel: end };

  return (
    <div
      ref={ringRef}
      className="hero-ring"
      data-hero-stage
      data-mode={manual ? "manual" : "intro"}
      data-state={ring.state}
      data-dragging={dragging}
    >
      <LandingRing fraction={ring.fraction} state={ring.state} decorative halo className="lr--hero">
        <div className="hero-centre">
          <span aria-hidden="true" className="hero-mono">
            {initialsOf(ring.name)}
          </span>
          <span aria-hidden="true" className="hero-count" style={{ "--d": days } as CSSProperties} />
          <div className="hero-labels">
            <div aria-hidden="true" className="hero-label hero-label--ok">
              <StateLine state="comfortable">{strings.ring.state.comfortable}</StateLine>
            </div>
            <div aria-hidden="true" className="hero-label hero-label--soon">
              <StateLine state="soon">{strings.ring.state.soon}</StateLine>
            </div>
            <div className="hero-label hero-label--final">
              <StateLine state={ring.state}>{ring.label}</StateLine>
            </div>
          </div>
          <p className="hero-chip" data-shown={days <= REMINDER_DAYS}>
            <Bell aria-hidden="true" size={16} strokeWidth={2} className="shrink-0" />
            <span>{strings.landing.reminder.renewsIn(ring.name, days)}</span>
          </p>
        </div>
      </LandingRing>

      <svg className="hero-band" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <circle cx={50} cy={50} r={44} fill="none" strokeWidth={12} onPointerDown={(event) => begin(event, false)} {...grab} />
      </svg>

      <p id="hero-hint" className="hero-hint" data-hidden={manual}>
        {copy.dragHint}
      </p>

      <div
        role="slider"
        tabIndex={0}
        className="hero-handle"
        style={{ left: `${point.x}%`, top: `${point.y}%` }}
        aria-label={copy.sliderLabel(ring.name)}
        aria-describedby="hero-hint"
        aria-valuemin={0}
        aria-valuemax={SCRUB_CYCLE_DAYS}
        aria-valuenow={days}
        aria-valuetext={copy.sliderValue(ring.label, ring.stateLabel)}
        onPointerDown={(event) => begin(event, true)}
        onKeyDown={onKeyDown}
        {...grab}
      />
    </div>
  );
}
