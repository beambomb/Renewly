import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SectionIcon } from "@/components/sections/section-icon";
import { ITEM_KINDS } from "@/lib/items/types";
import { strings } from "@/lib/strings";

/** The five sections as large cards: one column on phones, a grid on wider screens. */
export function AddPicker({ basePath = "/add" }: { basePath?: string }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {ITEM_KINDS.map((kind) => {
        const meta = strings.item.kinds[kind];
        return (
          <li key={kind}>
            <Link
              href={`${basePath}/${kind}`}
              className="group flex h-full min-h-16 items-center gap-4 rounded-lg border border-border bg-card p-5 text-card-foreground transition-colors duration-[var(--duration-fast)] hover:border-muted-foreground hover:bg-muted active:bg-muted sm:flex-col sm:items-start sm:gap-5"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-md bg-muted text-secondary group-hover:bg-card">
                <SectionIcon kind={kind} size={26} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-lg font-semibold">{meta.name}</span>
                <span className="text-muted-foreground">{meta.description}</span>
              </span>
              <ChevronRight aria-hidden="true" size={20} className="shrink-0 text-muted-foreground sm:hidden" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
