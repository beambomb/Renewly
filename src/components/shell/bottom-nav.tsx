"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, House, Plus, Settings } from "lucide-react";
import { strings } from "@/lib/strings";

const ITEMS = [
  { href: "/", label: strings.nav.home, Icon: House },
  { href: "/add", label: strings.nav.add, Icon: Plus },
  { href: "/alerts", label: strings.nav.alerts, Icon: Bell },
  { href: "/settings", label: strings.nav.settings, Icon: Settings },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label={strings.nav.primaryLabel}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex h-[var(--nav-height)] max-w-[1120px] items-stretch gap-2 px-2">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full min-h-11 flex-col items-center justify-center gap-1 rounded-md text-sm font-medium transition-colors duration-[var(--duration-fast)] active:bg-muted ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon aria-hidden="true" size={24} strokeWidth={2} />
                <span>{label}</span>
                {active ? <span aria-hidden="true" className="h-0.5 w-6 rounded-full bg-primary" /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
