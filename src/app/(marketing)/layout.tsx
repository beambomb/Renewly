import type { ReactNode } from "react";
import type { Viewport } from "next";
import "./welcome/landing.css";

// The landing is always dark. A metadata literal cannot read a CSS variable, so this mirrors
// the dark --color-background value (same literal as src/app/layout.tsx).
export const viewport: Viewport = { themeColor: "#0F172A" };

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div id="top" className="dark landing-root min-h-dvh bg-background text-foreground">
      {children}
    </div>
  );
}
