import type { Metadata } from "next";
import { Brand } from "@/components/brand/brand";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { strings } from "@/lib/strings";
import { AuthSwitch } from "../_components/auth-field";
import { SignUpForm } from "./_components/sign-up-form";

export const metadata: Metadata = { title: strings.auth.signUpTitle };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignUpPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeRedirectPath(first(params.next));

  return (
    <>
      <Brand href="/" size="md" />
      <h1 className="mt-6 text-[2rem] font-bold leading-tight text-foreground">{strings.auth.signUpTitle}</h1>
      <p className="mb-6 mt-2 text-muted-foreground">{strings.auth.signUpLead}</p>
      <SignUpForm next={next} />
      <AuthSwitch prompt={strings.auth.haveAccountPrompt} label={strings.auth.signInLink} path="/sign-in" next={next} />
    </>
  );
}
