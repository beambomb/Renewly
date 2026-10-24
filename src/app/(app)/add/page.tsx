import type { Metadata } from "next";
import { strings } from "@/lib/strings";

export const metadata: Metadata = { title: strings.pages.addTitle };

export default function AddPage() {
  return (
    <>
      <h1 className="text-[2rem] font-bold leading-tight text-foreground">{strings.pages.addTitle}</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">{strings.pages.addLead}</p>
    </>
  );
}
