import { describe, expect, it } from "vitest";
import { classifyAuthFailure, messageForFailure, type AuthFailureKind } from "./errors";

describe("classifyAuthFailure", () => {
  it("maps wrong credentials to one generic kind", () => {
    expect(classifyAuthFailure({ code: "invalid_credentials", status: 400 })).toBe("invalid_credentials");
    expect(classifyAuthFailure({ code: "validation_failed", status: 400 })).toBe("invalid_credentials");
    expect(classifyAuthFailure({ code: "user_not_found", status: 400 })).toBe("invalid_credentials");
  });

  it("recognises an unconfirmed account", () => {
    expect(classifyAuthFailure({ code: "email_not_confirmed", status: 400 })).toBe("email_not_confirmed");
  });

  it("recognises rate limits", () => {
    expect(classifyAuthFailure({ code: "over_request_rate_limit", status: 429 })).toBe("rate_limited");
    expect(classifyAuthFailure({ code: "over_email_send_rate_limit", status: 429 })).toBe("rate_limited");
    expect(classifyAuthFailure({ status: 429 })).toBe("rate_limited");
  });

  it("recognises sign-up outcomes", () => {
    expect(classifyAuthFailure({ code: "user_already_exists", status: 422 })).toBe("email_exists");
    expect(classifyAuthFailure({ code: "email_exists", status: 422 })).toBe("email_exists");
    expect(classifyAuthFailure({ status: 422 })).toBe("email_exists");
    expect(classifyAuthFailure({ code: "signup_disabled", status: 422 })).toBe("signup_disabled");
    expect(classifyAuthFailure({ code: "weak_password", status: 422 })).toBe("weak_password");
  });

  it("treats server errors as a provider problem", () => {
    expect(classifyAuthFailure({ status: 500 })).toBe("server");
    expect(classifyAuthFailure({ code: "unexpected_failure", status: 500 })).toBe("server");
    expect(classifyAuthFailure({ code: "hook_timeout", status: 422 })).toBe("server");
  });

  it("treats a missing status as unreachable", () => {
    expect(classifyAuthFailure({})).toBe("unreachable");
    expect(classifyAuthFailure({ status: 0 })).toBe("unreachable");
  });

  it("does not disguise other client errors as a wrong password", () => {
    expect(classifyAuthFailure({ status: 400, code: "something_new" })).toBe("unknown");
    expect(classifyAuthFailure({ status: 422, code: "email_provider_disabled" })).toBe("unknown");
  });
});

describe("messageForFailure", () => {
  it("has a message for every kind", () => {
    const kinds: AuthFailureKind[] = [
      "invalid_credentials",
      "email_not_confirmed",
      "rate_limited",
      "email_exists",
      "signup_disabled",
      "weak_password",
      "server",
      "unreachable",
      "unknown",
    ];
    for (const kind of kinds) {
      expect(messageForFailure(kind).length).toBeGreaterThan(10);
    }
  });

  it("gives the same non-enumerating message however the credentials were wrong", () => {
    const codes = ["invalid_credentials", "validation_failed", "user_not_found"];
    const messages = new Set(codes.map((code) => messageForFailure(classifyAuthFailure({ code, status: 400 }))));
    expect(messages.size).toBe(1);
    expect([...messages][0]).toBe("Email or password is incorrect.");
    expect([...messages][0]).not.toMatch(/exist|found|registered/i);
  });
});
