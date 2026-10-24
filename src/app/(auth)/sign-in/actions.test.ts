import { beforeEach, describe, expect, it, vi } from "vitest";
import { strings } from "@/lib/strings";

const signInWithPassword = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { signInWithPassword } }),
}));

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));

import { signIn, type SignInState } from "./actions";

const EMAIL = "user@example.com";
const PASSWORD = "not-a-real-password";
const IDLE: SignInState = { status: "idle" };

function form(fields: Record<string, string | File>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

beforeEach(() => {
  signInWithPassword.mockReset();
  errorSpy.mockClear();
});

describe("signIn action", () => {
  it("rejects an invalid email without calling Supabase", async () => {
    const state = await signIn(IDLE, form({ email: "nope", password: PASSWORD }));
    expect(state).toMatchObject({ status: "error", emailError: strings.auth.invalidEmail });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("rejects an empty password without calling Supabase", async () => {
    const state = await signIn(IDLE, form({ email: EMAIL, password: "" }));
    expect(state).toMatchObject({ status: "error", email: EMAIL, passwordError: strings.auth.passwordRequired });
    expect(state).not.toHaveProperty("emailError");
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("treats non-string form values as invalid", async () => {
    const file = new File(["x"], "x.txt");
    const state = await signIn(IDLE, form({ email: file, password: file }));
    expect(state).toMatchObject({
      status: "error",
      emailError: strings.auth.invalidEmail,
      passwordError: strings.auth.passwordRequired,
    });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("signs in with the normalised email and redirects to a relative next path", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    await expect(signIn(IDLE, form({ email: "  User@Example.COM ", password: PASSWORD, next: "/items/42" }))).rejects.toThrow(
      "REDIRECT:/items/42",
    );
    expect(signInWithPassword).toHaveBeenCalledWith({ email: EMAIL, password: PASSWORD });
  });

  it("redirects home when next is missing", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    await expect(signIn(IDLE, form({ email: EMAIL, password: PASSWORD }))).rejects.toThrow("REDIRECT:/");
  });

  it("ignores an external or protocol-relative next", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    for (const next of ["https://evil.com", "//evil.com", "/\\evil.com"]) {
      await expect(signIn(IDLE, form({ email: EMAIL, password: PASSWORD, next }))).rejects.toThrow("REDIRECT:/");
    }
  });

  it("returns the generic message for wrong credentials and never echoes the password", async () => {
    signInWithPassword.mockResolvedValue({ error: { code: "invalid_credentials", status: 400 } });
    const state = await signIn(IDLE, form({ email: EMAIL, password: PASSWORD }));
    expect(state).toEqual({ status: "error", email: EMAIL, message: strings.auth.errors.invalid_credentials });
    expect(JSON.stringify(state)).not.toContain(PASSWORD);
  });

  it("maps rate limits and network failures", async () => {
    signInWithPassword.mockResolvedValue({ error: { code: "over_request_rate_limit", status: 429 } });
    expect(await signIn(IDLE, form({ email: EMAIL, password: PASSWORD }))).toMatchObject({
      message: strings.auth.errors.rate_limited,
    });

    signInWithPassword.mockRejectedValue(new TypeError("fetch failed"));
    expect(await signIn(IDLE, form({ email: EMAIL, password: PASSWORD }))).toMatchObject({
      message: strings.auth.errors.unreachable,
    });
  });

  it("never logs the email or password", async () => {
    signInWithPassword.mockResolvedValueOnce({ error: { code: "invalid_credentials", status: 400, message: `bad ${EMAIL}` } });
    await signIn(IDLE, form({ email: EMAIL, password: PASSWORD }));
    signInWithPassword.mockRejectedValueOnce(new Error(`${EMAIL} ${PASSWORD}`));
    await signIn(IDLE, form({ email: EMAIL, password: PASSWORD }));

    expect(errorSpy).toHaveBeenCalledTimes(2);
    const logged = JSON.stringify(errorSpy.mock.calls);
    expect(logged).not.toContain(EMAIL);
    expect(logged).not.toContain(PASSWORD);
  });
});
