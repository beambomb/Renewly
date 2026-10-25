import Link from "next/link";
import { strings } from "@/lib/strings";

/** The ring as a mark: a track with a short arc. Decorative; the wordmark is the name. */
export function RingMark() {
  return (
    <svg viewBox="0 0 100 100" width="28" height="28" aria-hidden="true" focusable="false">
      <g transform="rotate(-90 50 50)" fill="none" strokeWidth="14" pathLength={100}>
        <circle cx="50" cy="50" r="40" pathLength={100} className="stroke-track" />
        <circle
          cx="50"
          cy="50"
          r="40"
          pathLength={100}
          strokeLinecap="round"
          strokeDasharray="100"
          strokeDashoffset="68"
          className="stroke-primary"
        />
      </g>
    </svg>
  );
}

export function LandingHeader() {
  return (
    <header className="landing-header">
      <div className="landing-frame">
        <Link
          href="/"
          aria-label={strings.landing.header.home}
          className="inline-flex min-h-11 items-center gap-2 text-lg font-semibold text-foreground"
        >
          <RingMark />
          {strings.app.name}
        </Link>
      </div>
    </header>
  );
}
