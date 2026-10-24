import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SectionIcon } from "@/components/sections/section-icon";
import { ITEM_KINDS } from "@/lib/items/types";
import { strings } from "@/lib/strings";

export const metadata: Metadata = { title: strings.pages.addTitle };

export default function AddPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-[2rem] font-bold leading-tight text-foreground">{strings.pages.addTitle}</h1>
      <p className="mt-2 text-muted-foreground">{strings.pages.addLead}</p>
      <ul className="mt-6 flex flex-col gap-3">
        {ITEM_KINDS.map((kind) => {
          const meta = strings.item.kinds[kind];
          return (
            <li key={kind}>
              <Link
                href={`/add/${kind}`}
                className="flex min-h-16 items-center gap-4 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors duration-[var(--duration-fast)] hover:bg-muted active:bg-muted"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-md bg-muted text-secondary">
                  <SectionIcon kind={kind} />
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="font-semibold">{meta.name}</span>
                  <span className="text-sm text-muted-foreground">{meta.description}</span>
                </span>
                <ChevronRight aria-hidden="true" size={20} className="shrink-0 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
