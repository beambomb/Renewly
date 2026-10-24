import type { ReactNode } from "react";

/** Consistent page title block: heading, optional lead text and optional actions on the right. */
export function PageHeader({
  title,
  lead,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="mb-1 text-sm font-medium text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-foreground [overflow-wrap:anywhere] md:text-[2.5rem]">
          {title}
        </h1>
        {lead ? <p className="mt-2 max-w-prose text-muted-foreground">{lead}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}
