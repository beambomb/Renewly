import { describe, expect, it } from "vitest";
import { decideAccess, isPublicPath } from "./access";

const base = { search: "", isAuthenticated: false, supabaseConfigured: true, isDevelopment: false };

describe("isPublicPath", () => {
  it("allows sign-in, auth callbacks and PWA files", () => {
    for (const path of ["/sign-in", "/auth/callback", "/auth/confirm", "/manifest.webmanifest", "/sw.js", "/icons/icon-192.png", "/offline"]) {
      expect(isPublicPath(path)).toBe(true);
    }
  });

  it("does not treat look-alike paths as public", () => {
    for (const path of ["/", "/settings", "/sign-in-evil", "/authx/callback", "/sw.json", "/iconsx/a.png"]) {
      expect(isPublicPath(path)).toBe(false);
    }
  });
});

describe("decideAccess", () => {
  it("sends signed-out users to sign-in and remembers where they were going", () => {
    expect(decideAccess({ ...base, pathname: "/" })).toEqual({ type: "redirect", location: "/sign-in" });
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
    expect(decideAccess({ ...base, pathname: "/auth/callback" })).toEqual({ type: "allow" });
  });

  it("moves signed-in users away from the sign-in page", () => {
    expect(decideAccess({ ...base, pathname: "/sign-in", isAuthenticated: true })).toEqual({ type: "redirect", location: "/" });
  });

  it("fails closed when Supabase is not configured", () => {
    expect(decideAccess({ ...base, pathname: "/", supabaseConfigured: false })).toEqual({ type: "unconfigured" });
    expect(decideAccess({ ...base, pathname: "/sign-in", supabaseConfigured: false })).toEqual({ type: "unconfigured" });
    expect(decideAccess({ ...base, pathname: "/dev/rings", supabaseConfigured: false })).toEqual({ type: "unconfigured" });
  });

  it("only exposes /dev pages without configuration in development", () => {
    const dev = { ...base, supabaseConfigured: false, isDevelopment: true };
    expect(decideAccess({ ...dev, pathname: "/dev/rings" })).toEqual({ type: "allow" });
    expect(decideAccess({ ...dev, pathname: "/devious" })).toEqual({ type: "unconfigured" });
    expect(decideAccess({ ...dev, pathname: "/" })).toEqual({ type: "unconfigured" });
  });
});
