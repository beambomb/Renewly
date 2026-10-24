import type { ReactNode } from "react";
import { strings } from "@/lib/strings";
import { BottomNav } from "./bottom-nav";

/** Header, main landmark and bottom navigation with safe-area padding. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-background pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center px-4 md:px-6">
          <span className="text-lg font-bold text-foreground">{strings.app.name}</span>
        </div>
      </header>
      <main
        id="main"
        className="mx-auto max-w-[1120px] scroll-mt-14 px-4 pb-[var(--content-bottom-pad)] pt-6 md:px-6"
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
