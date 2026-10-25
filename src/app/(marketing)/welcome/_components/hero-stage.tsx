"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";

/** Safety net: if the observer never reports, the sequence keeps playing. */
const OBSERVER_GIVE_UP_MS = 1500;

/**
 * Behaviour only: pauses the hero sequence while the ring is off-screen or the tab is
 * hidden, and replays it on request. All markup arrives as server-rendered children.
 */
export function HeroStage({ children, replayLabel }: { children: ReactNode; replayLabel: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let offscreen = false;
    let hidden = document.visibilityState === "hidden";
    const apply = () => {
      section.dataset.playing = String(!offscreen && !hidden);
    };
    apply();

    const onVisibility = () => {
      hidden = document.visibilityState === "hidden";
      apply();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Observe the ring itself (bounded size), so a tall stacked hero cannot stay paused forever.
    let observer: IntersectionObserver | undefined;
    let reported = false;
    const timer = window.setTimeout(() => {
      if (!reported) {
        offscreen = false;
        apply();
      }
    }, OBSERVER_GIVE_UP_MS);
    if (!reduce.matches && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          reported = true;
          const last = entries[entries.length - 1];
          if (!last) return;
          offscreen = !last.isIntersecting;
          apply();
        },
        { threshold: 0 },
      );
      observer.observe(section.querySelector("[data-hero-stage]") ?? section);
    }

    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const replay = () => {
    const section = ref.current;
    if (!section || typeof section.getAnimations !== "function") return;
    for (const animation of section.getAnimations({ subtree: true })) {
      animation.cancel();
      animation.play();
    }
  };

  return (
    <section ref={ref} className="landing-hero" aria-labelledby="hero-title" data-playing="true">
      {children}
      <button type="button" onClick={replay} className="landing-hero__replay">
        <RotateCcw aria-hidden="true" size={16} strokeWidth={2} />
        {replayLabel}
      </button>
    </section>
  );
}
