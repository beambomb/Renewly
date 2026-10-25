import type { SVGProps } from "react";

type LogoMarkProps = Omit<SVGProps<SVGSVGElement>, "title" | "viewBox" | "children"> & {
  /** Gives the mark an accessible name. Omit when a visible label sits beside it. */
  title?: string;
  /** Draws the end dot in currentColor too, for single-colour contexts. */
  monochrome?: boolean;
};

/*
 * Geometry lives in a 64-unit box: ring radius 20, stroke 9, 300 degree arc from
 * 12 o'clock clockwise, end dot (the "time left" handle) at 10 o'clock.
 * Keep in sync with public/icons/*.svg and src/app/icon.svg.
 */
export function LogoMark({ title, monochrome = false, className, ...rest }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className ?? "size-6"}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path d="M32 12A20 20 0 1 1 14.68 22" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
      <circle cx="14.68" cy="22" r="6.5" className={monochrome ? "fill-current" : "fill-status-ok"} />
    </svg>
  );
}
