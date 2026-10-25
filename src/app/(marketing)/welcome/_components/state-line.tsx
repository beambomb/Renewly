import { Check, Clock, TriangleAlert } from "lucide-react";
import type { DemoState } from "@/lib/landing/demo";

const TEXT_CLASS: Record<DemoState, string> = {
  comfortable: "text-status-ok",
  soon: "text-status-soon",
  urgent: "text-status-urgent",
};

const GLYPH = { comfortable: Check, soon: Clock, urgent: TriangleAlert } as const;

/** State glyph plus text, so state is never conveyed by colour alone. */
export function StateLine({ state, children, className }: { state: DemoState; children: string; className?: string }) {
  const Glyph = GLYPH[state];
  return (
    <p className={`flex items-center justify-center gap-1 text-sm font-medium ${TEXT_CLASS[state]} ${className ?? ""}`}>
      <Glyph aria-hidden="true" size={16} strokeWidth={2} />
      <span>{children}</span>
    </p>
  );
}
