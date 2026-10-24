import type { CSSProperties, ReactNode } from "react";
import { Ban, Check, Clock, OctagonAlert, Pause, TriangleAlert } from "lucide-react";
import { initialsOf } from "@/lib/initials";
import type { ItemStatus, RingState, RingViewModel } from "@/lib/rings/ring";

export type RingSize = "sm" | "md" | "lg";

/** Pixel geometry per size. The ring is drawn in a square viewBox. */
const GEOMETRY: Record<RingSize, { box: number; stroke: number; logo: number }> = {
  sm: { box: 56, stroke: 5, logo: 32 },
  md: { box: 96, stroke: 8, logo: 56 },
  lg: { box: 160, stroke: 10, logo: 96 },
};

const STROKE_CLASS: Record<RingState, string> = {
  comfortable: "stroke-status-ok",
  soon: "stroke-status-soon",
  urgent: "stroke-status-urgent",
  overdue: "stroke-status-overdue",
  inactive: "stroke-muted-foreground",
};

const TEXT_CLASS: Record<RingState, string> = {
  comfortable: "text-status-ok",
  soon: "text-status-soon",
  urgent: "text-status-urgent",
  overdue: "text-status-overdue",
  inactive: "text-muted-foreground",
};

/** A distinct glyph per state so colour is never the only signal. */
function StateGlyph({ state, paused }: { state: RingState; paused: boolean }) {
  const common = { "aria-hidden": true, size: 16, strokeWidth: 2 } as const;
  switch (state) {
    case "comfortable":
      return <Check {...common} />;
    case "soon":
      return <Clock {...common} />;
    case "urgent":
      return <TriangleAlert {...common} />;
    case "overdue":
      return <OctagonAlert {...common} />;
    case "inactive":
      return paused ? <Pause {...common} /> : <Ban {...common} />;
  }
}

export interface RingLogo {
  /** Signed URL of an uploaded logo. */
  src?: string | null;
  /** User-chosen emoji, used when there is no image. */
  emoji?: string | null;
}

interface RingProps {
  name: string;
  vm: RingViewModel;
  logo?: RingLogo;
  size?: RingSize;
}

function LogoContent({ name, logo, px }: { name: string; logo?: RingLogo | undefined; px: number }) {
  if (logo?.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL, already resized to <=256px
      <img
        src={logo.src}
        alt=""
        width={px}
        height={px}
        loading="lazy"
        decoding="async"
        className="rounded-full object-cover"
        style={{ width: px, height: px }}
      />
    );
  }
  if (logo?.emoji) {
    return (
      <span aria-hidden="true" className="leading-none" style={{ fontSize: px * 0.55 }}>
        {logo.emoji}
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="font-semibold leading-none text-muted-foreground"
      style={{ fontSize: px * 0.36 }}
    >
      {initialsOf(name)}
    </span>
  );
}

/**
 * The circular progress graphic. The ring shows time LEFT: it starts full and
 * shrinks as the due date approaches. Overdue draws a full dashed ring, urgent
 * draws a dashed track, so state is visible beyond colour.
 */
export function Ring({ name, vm, logo, size = "md" }: RingProps) {
  const { box, stroke, logo: logoPx } = GEOMETRY[size];
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = box / 2;

  const showProgress = vm.state !== "overdue";
  const offset = circumference * (1 - vm.fractionLeft);
  const dashedTrack = vm.state === "urgent";
  const dashedFull = vm.state === "overdue";

  return (
    <div
      className="relative inline-grid place-items-center"
      style={{ width: box, height: box }}
      data-state={vm.state}
    >
      <svg
        role="img"
        aria-label={vm.ariaLabel}
        viewBox={`0 0 ${box} ${box}`}
        width={box}
        height={box}
        className="-rotate-90"
        focusable="false"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-track"
          strokeDasharray={dashedTrack ? "3 6" : undefined}
        />
        {showProgress && vm.fractionLeft > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`ring-progress ${STROKE_CLASS[vm.state]}`}
            style={{ "--ring-circumference": circumference } as CSSProperties}
            data-testid="ring-progress"
          />
        )}
        {dashedFull && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeDasharray="8 6"
            className={STROKE_CLASS.overdue}
            data-testid="ring-overdue"
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <LogoContent name={name} logo={logo} px={logoPx} />
      </div>
    </div>
  );
}

interface RingCardProps extends RingProps {
  status: ItemStatus;
  /** Extra line under the time-left text, for example a price or date. */
  detail?: ReactNode;
}

/** The time-left text led by a state glyph, so state is never conveyed by colour alone. */
export function TimeLabel({ vm, status }: { vm: RingViewModel; status: ItemStatus }) {
  return (
    <p className={`flex items-center gap-1 text-sm font-medium ${TEXT_CLASS[vm.state]}`}>
      <StateGlyph state={vm.state} paused={status === "paused"} />
      <span>{vm.label}</span>
    </p>
  );
}

/** Ring with the name and a time-left line led by a state glyph (never colour alone). */
export function RingCard({ name, vm, logo, size = "md", status, detail }: RingCardProps) {
  return (
    <div className="flex flex-col items-center gap-2 text-center" data-state={vm.state}>
      <Ring name={name} vm={vm} logo={logo} size={size} />
      <p className="max-w-full truncate text-base font-medium text-card-foreground">{name}</p>
      <TimeLabel vm={vm} status={status} />
      {detail ? <div className="text-sm text-muted-foreground">{detail}</div> : null}
    </div>
  );
}
