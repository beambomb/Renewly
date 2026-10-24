import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "./env";

const valid = {
  NEXT_PUBLIC_SUPABASE_URL: "https://abcdefgh.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "a-long-enough-public-anon-key-value",
};

describe("parsePublicEnv", () => {
  it("accepts just the Supabase URL and key", () => {
    expect(parsePublicEnv(valid).ok).toBe(true);
  });

  it("accepts the newer sb_publishable key format", () => {
    expect(parsePublicEnv({ ...valid, NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_AbCdEfGhIjKlMnOpQrStUv_1234567" }).ok).toBe(true);
  });

  it("accepts http only for localhost", () => {
    expect(parsePublicEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321" }).ok).toBe(true);
    expect(parsePublicEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321" }).ok).toBe(true);
    expect(parsePublicEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "http://example.com" }).ok).toBe(false);
  });

  it("reports missing variables by name only", () => {
    const result = parsePublicEnv({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.invalid).toEqual(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]);
    }
  });

  it("treats empty strings as missing and never echoes values", () => {
    const result = parsePublicEnv({ ...valid, NEXT_PUBLIC_SUPABASE_ANON_KEY: "" });
    expect(result).toEqual({ ok: false, invalid: ["NEXT_PUBLIC_SUPABASE_ANON_KEY"] });
    expect(JSON.stringify(result)).not.toContain("abcdefgh");
  });

  it("rejects a too-short key", () => {
    expect(parsePublicEnv({ ...valid, NEXT_PUBLIC_SUPABASE_ANON_KEY: "short" })).toEqual({
      ok: false,
      invalid: ["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    });
  });

  it("ignores variables it does not need", () => {
    expect(parsePublicEnv({ ...valid, NEXT_PUBLIC_SITE_URL: "not a url" }).ok).toBe(true);
  });
});
