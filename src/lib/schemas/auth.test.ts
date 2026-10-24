import { describe, expect, it } from "vitest";
import { callbackParamsSchema, confirmParamsSchema, signInSchema } from "./auth";

describe("signInSchema", () => {
  const password = "not-a-real-password";

  it("trims and lowercases a valid email", () => {
    const result = signInSchema.safeParse({ email: "  Name@Example.COM ", password });
    expect(result.success && result.data.email).toBe("name@example.com");
  });

  it("rejects invalid emails", () => {
    for (const email of ["", "   ", "name", "name@", "@example.com", "a b@example.com", "name@example"]) {
      expect(signInSchema.safeParse({ email, password }).success).toBe(false);
    }
  });

  it("rejects overly long emails", () => {
    const long = `${"a".repeat(250)}@example.com`;
    expect(signInSchema.safeParse({ email: long, password }).success).toBe(false);
  });

  it("rejects a non-string email (for example a File)", () => {
    expect(signInSchema.safeParse({ email: null, password }).success).toBe(false);
    expect(signInSchema.safeParse({ password }).success).toBe(false);
  });

  it("keeps the password exactly as typed", () => {
    const result = signInSchema.safeParse({ email: "a@example.com", password: "  Pw With Spaces  " });
    expect(result.success && result.data.password).toBe("  Pw With Spaces  ");
  });

  it("rejects an empty, missing or non-string password", () => {
    expect(signInSchema.safeParse({ email: "a@example.com", password: "" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "a@example.com" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "a@example.com", password: null }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "a@example.com", password: 123456 }).success).toBe(false);
  });

  it("does not enforce a minimum password length at login", () => {
    expect(signInSchema.safeParse({ email: "a@example.com", password: "x" }).success).toBe(true);
  });

  it("rejects overly long passwords", () => {
    expect(signInSchema.safeParse({ email: "a@example.com", password: "p".repeat(256) }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "a@example.com", password: "p".repeat(257) }).success).toBe(false);
  });

  it("keeps an optional next path", () => {
    const result = signInSchema.safeParse({ email: "a@example.com", password, next: "/items/1" });
    expect(result.success && result.data.next).toBe("/items/1");
  });

  it("rejects an overly long next path", () => {
    expect(signInSchema.safeParse({ email: "a@example.com", password, next: `/${"a".repeat(500)}` }).success).toBe(false);
  });
});

describe("link parameter schemas", () => {
  it("accepts a token hash link of type email or magiclink only", () => {
    expect(confirmParamsSchema.safeParse({ token_hash: "abc", type: "email" }).success).toBe(true);
    expect(confirmParamsSchema.safeParse({ token_hash: "abc", type: "magiclink" }).success).toBe(true);
    expect(confirmParamsSchema.safeParse({ token_hash: "abc", type: "recovery" }).success).toBe(false);
    expect(confirmParamsSchema.safeParse({ token_hash: "", type: "email" }).success).toBe(false);
  });

  it("requires a code for the callback", () => {
    expect(callbackParamsSchema.safeParse({ code: "xyz" }).success).toBe(true);
    expect(callbackParamsSchema.safeParse({}).success).toBe(false);
    expect(callbackParamsSchema.safeParse({ code: "" }).success).toBe(false);
  });
});
