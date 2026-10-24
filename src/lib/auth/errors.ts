import { strings } from "@/lib/strings";

export interface AuthFailure {
  code?: string | undefined;
  status?: number | undefined;
}

export type AuthFailureKind =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "rate_limited"
  | "server"
  | "unreachable"
  | "unknown";

/**
 * Maps a Supabase Auth error to something a person can act on. Only the error
 * code and HTTP status are used: no email address, password or message text.
 * Unknown 4xx codes stay "unknown" so a misconfiguration is not shown as a wrong password.
 */
export function classifyAuthFailure(failure: AuthFailure): AuthFailureKind {
  switch (failure.code) {
    case "invalid_credentials":
    case "validation_failed":
    case "user_not_found":
      return "invalid_credentials";
    case "email_not_confirmed":
      return "email_not_confirmed";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rate_limited";
    case "unexpected_failure":
    case "hook_timeout":
      return "server";
  }
  if (failure.status === 429) return "rate_limited";
  if (failure.status === undefined || failure.status === 0) return "unreachable";
  if (failure.status >= 500) return "server";
  return "unknown";
}

export function messageForFailure(kind: AuthFailureKind): string {
  return strings.auth.errors[kind];
}
