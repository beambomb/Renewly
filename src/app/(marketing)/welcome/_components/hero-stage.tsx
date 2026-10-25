"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Safety net: if the observer never reports, the sequence keeps playing. */
const OBSERVER_GIVE_UP_MS = 1500;

/**
 * Behaviour only: pauses the hero sequence while the ring is off-screen or the tab is
 * hidden. All markup arrives as server-rendered children.
 */
export function HeroStage({ children }: { children: ReactNode }) {
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

  return (
    <section ref={ref} className="landing-hero" aria-labelledby="hero-title" data-playing="true">
      {children}
    </section>
  );
}
