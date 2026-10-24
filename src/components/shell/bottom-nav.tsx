"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, House, Plus, Settings, type LucideIcon } from "lucide-react";
import { strings } from "@/lib/strings";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const MOBILE_ITEMS: readonly NavItem[] = [
  { href: "/", label: strings.nav.home, Icon: House },
  { href: "/add", label: strings.nav.add, Icon: Plus },
  { href: "/alerts", label: strings.nav.alerts, Icon: Bell },
  { href: "/settings", label: strings.nav.settings, Icon: Settings },
];

/** On wide screens "Add" is a button above the list, so the sidebar only lists destinations. */
const SIDEBAR_ITEMS: readonly NavItem[] = MOBILE_ITEMS.filter((item) => item.href !== "/add");

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Phone navigation: fixed to the bottom, within thumb reach. Hidden from 768px up. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label={strings.nav.primaryLabel}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex h-[var(--nav-height)] items-stretch gap-2 px-2">
        {MOBILE_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full min-h-11 flex-col items-center justify-center gap-1 rounded-md text-sm font-medium transition-colors duration-[var(--duration-fast)] active:bg-muted ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon aria-hidden="true" size={24} strokeWidth={2} />
                <span>{label}</span>
                {active ? <span aria-hidden="true" className="h-0.5 w-6 rounded-full bg-foreground" /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Desktop navigation: a fixed left column from 768px up. */
export function SideNav() {
  const pathname = usePathname();
  return (
    <nav aria-label={strings.nav.primaryLabel} className="flex flex-1 flex-col gap-1">
      <ul className="flex flex-col gap-1">
        {SIDEBAR_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-base font-medium transition-colors duration-[var(--duration-fast)] hover:bg-muted ${
                  active ? "bg-muted text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon aria-hidden="true" size={20} strokeWidth={2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
