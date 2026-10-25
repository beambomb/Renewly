import { describe, expect, it } from "vitest";
import { decideAccess, isPublicPath } from "./access";

const base = { search: "", method: "GET", isAuthenticated: false, supabaseConfigured: true, isDevelopment: false };

describe("isPublicPath", () => {
  it("allows sign-in, auth callbacks and PWA files", () => {
    for (const path of ["/sign-in", "/sign-up", "/auth/callback", "/auth/confirm", "/manifest.webmanifest", "/sw.js", "/icons/icon-192.png", "/offline"]) {
      expect(isPublicPath(path)).toBe(true);
    }
  });

  it("does not treat look-alike paths as public", () => {
    for (const path of ["/", "/settings", "/sign-in-evil", "/sign-up-evil", "/authx/callback", "/sw.json", "/iconsx/a.png"]) {
      expect(isPublicPath(path)).toBe(false);
    }
  });
});

describe("decideAccess", () => {
  it("sends signed-out users to sign-in and remembers where they were going", () => {
    expect(decideAccess({ ...base, pathname: "/alerts" })).toEqual({ type: "redirect", location: "/sign-in?next=%2Falerts" });
    expect(decideAccess({ ...base, pathname: "/items/42", search: "?tab=history" })).toEqual({
      type: "redirect",
      location: "/sign-in?next=%2Fitems%2F42%3Ftab%3Dhistory",
    });
  });

  it("lets signed-in users through", () => {
    expect(decideAccess({ ...base, pathname: "/settings", isAuthenticated: true })).toEqual({ type: "allow" });
  });

  it("lets signed-out users reach the public pages", () => {
    expect(decideAccess({ ...base, pathname: "/sign-in" })).toEqual({ type: "allow" });
    expect(decideAccess({ ...base, pathname: "/sign-up" })).toEqual({ type: "allow" });
    expect(decideAccess({ ...base, pathname: "/auth/callback" })).toEqual({ type: "allow" });
  });

  it("moves signed-in users away from the sign-in and sign-up pages", () => {
    for (const pathname of ["/sign-in", "/sign-up"]) {
      expect(decideAccess({ ...base, pathname, isAuthenticated: true })).toEqual({ type: "redirect", location: "/" });
    }
  });

  it("still protects app pages from signed-out visitors", () => {
    expect(decideAccess({ ...base, pathname: "/alerts" })).toEqual({ type: "redirect", location: "/sign-in?next=%2Falerts" });
    expect(decideAccess({ ...base, pathname: "/sign-up-evil" })).toEqual({
      type: "redirect",
      location: "/sign-in?next=%2Fsign-up-evil",
    });
  });

  it("fails closed when Supabase is not configured", () => {
    expect(decideAccess({ ...base, pathname: "/", supabaseConfigured: false })).toEqual({ type: "unconfigured" });
    expect(decideAccess({ ...base, pathname: "/sign-in", supabaseConfigured: false })).toEqual({ type: "unconfigured" });
    expect(decideAccess({ ...base, pathname: "/dev/rings", supabaseConfigured: false })).toEqual({ type: "unconfigured" });
  });

  it("only exposes /dev pages in development, with or without configuration", () => {
    const dev = { ...base, supabaseConfigured: false, isDevelopment: true };
    expect(decideAccess({ ...dev, pathname: "/dev/rings" })).toEqual({ type: "allow" });
    expect(decideAccess({ ...dev, pathname: "/devious" })).toEqual({ type: "unconfigured" });
    expect(decideAccess({ ...dev, pathname: "/" })).toEqual({ type: "unconfigured" });
    // Configured and signed out: the preview page is still reachable in development.
    expect(decideAccess({ ...base, isDevelopment: true, pathname: "/dev/rings" })).toEqual({ type: "allow" });
    expect(decideAccess({ ...base, isDevelopment: true, pathname: "/settings" })).toEqual({
      type: "redirect",
      location: "/sign-in?next=%2Fsettings",
    });
  });

  it("forwards a sign-in code that landed on the site root to the callback", () => {
    expect(decideAccess({ ...base, pathname: "/", search: "?code=abc-123" })).toEqual({
      type: "redirect",
      location: "/auth/callback?code=abc-123",
    });
    // also when already signed in, and the code is encoded safely
    expect(decideAccess({ ...base, isAuthenticated: true, pathname: "/", search: "?code=a%26b" })).toEqual({
      type: "redirect",
      location: "/auth/callback?code=a%26b",
    });
  });

  it("does not forward oversized codes or codes on other pages", () => {
    expect(decideAccess({ ...base, pathname: "/", search: `?code=${"x".repeat(501)}` })).toEqual({
      type: "rewrite",
      location: "/welcome",
    });
    expect(decideAccess({ ...base, pathname: "/settings", search: "?code=abc" }).type).toBe("redirect");
    expect(decideAccess({ ...base, pathname: "/settings", search: "?code=abc" })).toEqual({
      type: "redirect",
      location: "/sign-in?next=%2Fsettings%3Fcode%3Dabc",
    });
  });

  it("never exposes /dev pages in production", () => {
    expect(decideAccess({ ...base, pathname: "/dev/rings" })).toEqual({
      type: "redirect",
      location: "/sign-in?next=%2Fdev%2Frings",
    });
    expect(decideAccess({ ...base, supabaseConfigured: false, pathname: "/dev/rings" })).toEqual({ type: "unconfigured" });
  });
});
