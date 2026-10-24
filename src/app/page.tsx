import { strings } from "@/lib/strings";

export default function HomePage() {
  return (
    <main id="main" className="mx-auto max-w-[1120px] px-4 py-12 md:px-6">
      <h1 className="text-[2rem] font-bold leading-tight text-foreground">
        {strings.app.name}
      </h1>
      <p className="mt-2 max-w-prose text-muted-foreground">{strings.app.tagline}</p>
      <div className="mt-8 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="text-xl font-semibold">{strings.home.heading}</h2>
        <p className="mt-1 text-muted-foreground">{strings.home.lead}</p>
        <button
          type="button"
          className="mt-4 min-h-11 rounded-md bg-primary px-6 font-medium text-on-primary transition-colors duration-[var(--duration-press)] hover:opacity-90 active:opacity-80"
        >
          {strings.nav.add}
        </button>
      </div>
    </main>
  );
}
