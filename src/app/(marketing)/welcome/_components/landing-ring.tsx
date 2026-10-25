import type { CSSProperties, ReactNode } from "react";
import { ringOffset, type DemoState } from "@/lib/landing/demo";

const STROKE_CLASS: Record<DemoState, string> = {
  comfortable: "stroke-status-ok",
  soon: "stroke-status-soon",
  urgent: "stroke-status-urgent",
};

interface LandingRingProps {
  fraction: number;
  state: DemoState;
  /** Accessible name. Omit with `decorative` for rings whose text is shown beside them. */
  label?: string;
  decorative?: boolean;
  /** Adds the halo circle used by the hero pulse. */
  halo?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Centre slot. A sibling of the svg, so its text stays in the accessibility tree. */
  children?: ReactNode;
}

/**
 * Renewly's ring at landing scale. Geometry is in a 100-unit box with pathLength=100,
 * so dash values are plain percentages. The arc is drawn flat in the state colour.
 */
export function LandingRing({ fraction, state, label, decorative, halo, className, style, children }: LandingRingProps) {
  const a11y = decorative
    ? ({ "aria-hidden": true, focusable: "false" } as const)
    : ({ role: "img", "aria-label": label } as const);
  const urgent = state === "urgent";
  const circle = { cx: 50, cy: 50, r: 44, fill: "none", strokeWidth: 8, pathLength: 100 } as const;
  return (
    <div className={`lr ${className ?? ""}`} style={style}>
      <svg className="lr__svg" viewBox="0 0 100 100" {...a11y}>
        <g transform="rotate(-90 50 50)">
          <circle {...circle} className={`lr__track stroke-track ${urgent ? "lr__track--off" : ""}`} strokeDasharray="100" />
          <circle {...circle} className={`lr__dash stroke-track ${urgent ? "" : "lr__dash--off"}`} strokeDasharray="1.2 2.4" />
          {halo ? <circle {...circle} className="lr__halo stroke-status-urgent" strokeDasharray="100" /> : null}
          {fraction > 0 ? (
            <circle
              {...circle}
              className={`lr__arc ${STROKE_CLASS[state]}`}
              strokeLinecap="round"
              strokeDasharray="100"
              strokeDashoffset={ringOffset(fraction)}
            />
          ) : null}
        </g>
      </svg>
      <div className="lr__centre">{children}</div>
    </div>
  );
}
