import Link from "next/link";
import { Brand } from "@/components/brand/brand";
import { strings } from "@/lib/strings";

export function LandingHeader() {
  return (
    <header className="landing-header">
      <div className="landing-frame flex items-center justify-between gap-4">
        <Brand href="/" size="sm" />
        <Link
          href="/sign-up"
          className="inline-flex min-h-11 items-center px-2 text-base font-medium text-foreground underline decoration-border underline-offset-4 transition-colors duration-(--duration-fast) hover:decoration-foreground"
        >
          {strings.landing.header.createAccount}
        </Link>
      </div>
    </header>
  );
}
