import type { Metadata } from "next";
import { Brand } from "@/components/brand/brand";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { strings } from "@/lib/strings";
import { AuthSwitch } from "../_components/auth-field";
import { SignInForm } from "./_components/sign-in-form";

export const metadata: Metadata = { title: strings.auth.signInTitle };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeRedirectPath(first(params.next));
  const linkError = first(params.error) === "link";

  return (
    <>
      <Brand href="/" size="md" />
      <h1 className="mt-6 text-[2rem] font-bold leading-tight text-foreground">{strings.auth.signInTitle}</h1>
      <p className="mb-6 mt-2 text-muted-foreground">{strings.auth.signInLead}</p>
      <SignInForm next={next} linkError={linkError} />
      <AuthSwitch prompt={strings.auth.noAccountPrompt} label={strings.auth.createAccountLink} path="/sign-up" next={next} />
    </>
  );
}
