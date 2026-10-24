import { describe, expect, it } from "vitest";
import { classifyAuthFailure, messageForFailure } from "./errors";

describe("classifyAuthFailure", () => {
  it("recognises the built-in email limit and rate limits", () => {
    expect(classifyAuthFailure({ code: "over_email_send_rate_limit", status: 429 })).toBe("rate_limited");
    expect(classifyAuthFailure({ code: "over_request_rate_limit" })).toBe("rate_limited");
    expect(classifyAuthFailure({ status: 429 })).toBe("rate_limited");
  });

  it("recognises addresses the default mail sender may not deliver to", () => {
    expect(classifyAuthFailure({ code: "email_address_not_authorized", status: 400 })).toBe("not_authorized");
  });

  it("recognises disabled sign-ups and invalid addresses", () => {
    expect(classifyAuthFailure({ code: "signup_disabled", status: 422 })).toBe("signups_disabled");
    expect(classifyAuthFailure({ code: "email_address_invalid", status: 400 })).toBe("invalid_email");
  });

  it("treats server errors as a mail or provider problem", () => {
    expect(classifyAuthFailure({ status: 500 })).toBe("smtp");
    expect(classifyAuthFailure({ code: "unexpected_failure", status: 500 })).toBe("smtp");
  });

  it("treats a missing status as unreachable and the rest as unknown", () => {
    expect(classifyAuthFailure({})).toBe("unreachable");
    expect(classifyAuthFailure({ status: 0 })).toBe("unreachable");
    expect(classifyAuthFailure({ status: 400, code: "something_new" })).toBe("unknown");
  });

  it("has a message for every kind", () => {
    for (const kind of ["rate_limited", "not_authorized", "signups_disabled", "invalid_email", "smtp", "unreachable", "unknown"] as const) {
      expect(messageForFailure(kind).length).toBeGreaterThan(10);
    }
  });
});
