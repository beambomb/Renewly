import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, buildSecurityHeaders } from "./security-headers";

describe("security headers", () => {
  it("forbids framing and plugins", () => {
    const csp = buildContentSecurityPolicy({ isDev: false });
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
  });

  it("allows eval only in development", () => {
    expect(buildContentSecurityPolicy({ isDev: true })).toContain("'unsafe-eval'");
    expect(buildContentSecurityPolicy({ isDev: false })).not.toContain("'unsafe-eval'");
  });

  it("allows the Supabase origin for images and connections", () => {
    const csp = buildContentSecurityPolicy({
      isDev: false,
      supabaseUrl: "https://abc.supabase.co/some/path",
    });
    expect(csp).toContain("img-src 'self' data: blob: https://abc.supabase.co");
    expect(csp).toContain("connect-src 'self' https://abc.supabase.co wss://abc.supabase.co");
  });

  it("ignores an invalid Supabase URL", () => {
    const csp = buildContentSecurityPolicy({ isDev: false, supabaseUrl: "javascript:alert(1)" });
    expect(csp).not.toContain("javascript");
  });

  it("sets nosniff and HSTS only in production", () => {
    const prod = buildSecurityHeaders({ isDev: false });
    const dev = buildSecurityHeaders({ isDev: true });
    expect(prod.find((h) => h.key === "X-Content-Type-Options")?.value).toBe("nosniff");
    expect(prod.some((h) => h.key === "Strict-Transport-Security")).toBe(true);
    expect(dev.some((h) => h.key === "Strict-Transport-Security")).toBe(false);
  });
});
