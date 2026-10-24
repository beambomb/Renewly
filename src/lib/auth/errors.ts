import { strings } from "@/lib/strings";

export interface AuthFailure {
  code?: string | undefined;
  status?: number | undefined;
}

export type AuthFailureKind =
  | "rate_limited"
  | "not_authorized"
  | "signups_disabled"
  | "invalid_email"
  | "smtp"
  | "unreachable"
  | "unknown";

/**
 * Maps a Supabase Auth error to something a person can act on. Only the error
 * code and HTTP status are used: no email address, token or message text.
 */
export function classifyAuthFailure(failure: AuthFailure): AuthFailureKind {
  switch (failure.code) {
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
    case "over_sms_send_rate_limit":
      return "rate_limited";
    case "email_address_not_authorized":
      return "not_authorized";
    case "signup_disabled":
    case "otp_disabled":
      return "signups_disabled";
    case "email_address_invalid":
    case "validation_failed":
      return "invalid_email";
    case "unexpected_failure":
    case "hook_timeout":
      return "smtp";
  }
  if (failure.status === 429) return "rate_limited";
  if (failure.status === undefined || failure.status === 0) return "unreachable";
  if (failure.status >= 500) return "smtp";
  return "unknown";
}

export function messageForFailure(kind: AuthFailureKind): string {
  return strings.auth.errors[kind];
}
