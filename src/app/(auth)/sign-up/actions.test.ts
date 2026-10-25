import { beforeEach, describe, expect, it, vi } from "vitest";
import { strings } from "@/lib/strings";

const signUpCall = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { signUp: signUpCall } }),
}));

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));

import { signUp, type SignUpState } from "./actions";

const EMAIL = "user@example.com";
const PASSWORD = "not-a-real-password";
const IDLE: SignUpState = { status: "idle" };

function form(fields: Record<string, string | File>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const valid = { email: EMAIL, password: PASSWORD, confirmPassword: PASSWORD };

const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

beforeEach(() => {
  signUpCall.mockReset();
  errorSpy.mockClear();
});

describe("signUp action", () => {
  it("rejects bad input without calling Supabase", async () => {
    expect(await signUp(IDLE, form({ ...valid, email: "nope" }))).toMatchObject({
      status: "error",
      fieldErrors: { email: strings.auth.invalidEmail },
    });
    expect(await signUp(IDLE, form({ ...valid, password: "short", confirmPassword: "short" }))).toMatchObject({
      fieldErrors: { password: strings.auth.passwordTooShort },
    });
    expect(await signUp(IDLE, form({ ...valid, confirmPassword: "different-one" }))).toMatchObject({
      email: EMAIL,
      fieldErrors: { confirmPassword: strings.auth.passwordMismatch },
    });
    const file = new File(["x"], "x.txt");
    expect(await signUp(IDLE, form({ email: file, password: file, confirmPassword: file }))).toMatchObject({ status: "error" });
    expect(signUpCall).not.toHaveBeenCalled();
  });

  it("signs up with the normalised email and redirects to a relative next path", async () => {
    signUpCall.mockResolvedValue({ data: { session: { access_token: "t" } }, error: null });
    await expect(signUp(IDLE, form({ ...valid, email: "  User@Example.COM ", next: "/items/42" }))).rejects.toThrow(
      "REDIRECT:/items/42",
    );
    expect(signUpCall).toHaveBeenCalledWith({ email: EMAIL, password: PASSWORD });
  });

  it("falls back to home for a missing or hostile next", async () => {
    signUpCall.mockResolvedValue({ data: { session: { access_token: "t" } }, error: null });
    await expect(signUp(IDLE, form(valid))).rejects.toThrow("REDIRECT:/");
    for (const next of ["https://evil.com", "//evil.com", "/\\evil.com"]) {
      await expect(signUp(IDLE, form({ ...valid, next }))).rejects.toThrow("REDIRECT:/");
    }
  });

  it("asks the person to check their inbox when no session comes back", async () => {
    signUpCall.mockResolvedValue({ data: { session: null, user: { id: "u" } }, error: null });
    const state = await signUp(IDLE, form(valid));
    expect(state).toEqual({ status: "check-email", email: EMAIL });
    expect(strings.auth.checkInbox).toBe("Check your inbox to confirm your email");
  });

  it("explains that the email already has an account, without echoing the password", async () => {
    signUpCall.mockResolvedValue({ data: { session: null }, error: { code: "user_already_exists", status: 422 } });
    const state = await signUp(IDLE, form(valid));
    expect(state).toEqual({
      status: "error",
      email: EMAIL,
      message: strings.auth.errors.email_exists,
      accountExists: true,
    });
    expect(JSON.stringify(state)).not.toContain(PASSWORD);
  });

  it("maps rate limits, disabled sign-ups and network failures", async () => {
    signUpCall.mockResolvedValue({ data: { session: null }, error: { code: "over_request_rate_limit", status: 429 } });
    expect(await signUp(IDLE, form(valid))).toMatchObject({ message: strings.auth.errors.rate_limited });

    signUpCall.mockResolvedValue({ data: { session: null }, error: { code: "signup_disabled", status: 422 } });
    expect(await signUp(IDLE, form(valid))).toMatchObject({ message: strings.auth.errors.signup_disabled });

    signUpCall.mockRejectedValue(new TypeError("fetch failed"));
    expect(await signUp(IDLE, form(valid))).toMatchObject({ message: strings.auth.errors.unreachable });
  });

  it("never logs the email or password", async () => {
    signUpCall.mockResolvedValueOnce({
      data: { session: null },
      error: { code: "user_already_exists", status: 422, message: `${EMAIL} is registered` },
    });
    await signUp(IDLE, form(valid));
    signUpCall.mockRejectedValueOnce(new Error(`${EMAIL} ${PASSWORD}`));
    await signUp(IDLE, form(valid));

    expect(errorSpy).toHaveBeenCalledTimes(2);
    const logged = JSON.stringify(errorSpy.mock.calls);
    expect(logged).not.toContain(EMAIL);
    expect(logged).not.toContain(PASSWORD);
  });
});
