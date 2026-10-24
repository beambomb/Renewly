import { BellRing, PiggyBank, Repeat, ShieldCheck, ShoppingBasket, type LucideIcon } from "lucide-react";
import type { ItemKind } from "@/lib/items/types";

const ICONS: Record<ItemKind, LucideIcon> = {
  subscription: Repeat,
  reminder: BellRing,
  savings: PiggyBank,
  recurring: ShoppingBasket,
  warranty: ShieldCheck,
};

/** Decorative icon for a section; the section name is always shown as text next to it. */
export function SectionIcon({ kind, size = 24 }: { kind: ItemKind; size?: number }) {
  const Icon = ICONS[kind];
  return <Icon aria-hidden="true" size={size} strokeWidth={2} />;
}
