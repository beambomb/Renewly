import Link from "next/link";
import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { PRIMARY_BUTTON } from "@/components/form/fields";
import { strings } from "@/lib/strings";
import { BottomNav, SideNav } from "./bottom-nav";

function Brand() {
  return (
    <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-lg font-bold text-foreground">
      <span aria-hidden="true" className="grid size-8 place-items-center rounded-md bg-primary text-on-primary">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M12 3a9 9 0 1 0 9 9" />
        </svg>
      </span>
      {strings.app.name}
    </Link>
  );
}

/**
 * Phones: slim top bar and bottom navigation. From 768px: a fixed sidebar and a
 * centred content column (max 1200px), so wide screens use a proper grid
 * instead of a stretched mobile layout.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh md:pl-64">
      <aside className="hidden border-r border-border bg-card md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col md:gap-6 md:p-4">
        <Brand />
        <Link href="/add" className={`${PRIMARY_BUTTON} w-full`}>
          <Plus aria-hidden="true" size={18} />
          {strings.nav.addItem}
        </Link>
        <SideNav />
      </aside>

      <header className="sticky top-0 z-30 border-b border-border bg-background pt-[env(safe-area-inset-top)] md:hidden">
        <div className="flex h-14 items-center px-4">
          <Brand />
        </div>
      </header>

      <main
        id="main"
        className="mx-auto w-full max-w-[1200px] scroll-mt-14 px-4 pb-[var(--content-bottom-pad)] pt-6 md:px-8 md:pb-16 md:pt-10"
      >
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
