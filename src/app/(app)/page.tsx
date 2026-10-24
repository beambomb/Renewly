import { strings } from "@/lib/strings";

export default function HomePage() {
  return (
    <>
      <h1 className="text-[2rem] font-bold leading-tight text-foreground">{strings.home.heading}</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">{strings.home.lead}</p>
    </>
  );
}
