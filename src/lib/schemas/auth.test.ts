import { describe, expect, it } from "vitest";
import { callbackParamsSchema, confirmParamsSchema, signInSchema } from "./auth";

describe("signInSchema", () => {
  it("trims and lowercases a valid email", () => {
    const result = signInSchema.safeParse({ email: "  Name@Example.COM " });
    expect(result.success && result.data.email).toBe("name@example.com");
  });

  it("rejects invalid emails", () => {
    for (const email of ["", "   ", "name", "name@", "@example.com", "a b@example.com", "name@example"]) {
      expect(signInSchema.safeParse({ email }).success).toBe(false);
    }
  });

  it("rejects overly long emails", () => {
    const long = `${"a".repeat(250)}@example.com`;
    expect(signInSchema.safeParse({ email: long }).success).toBe(false);
  });

  it("rejects a non-string email (for example a File)", () => {
    expect(signInSchema.safeParse({ email: null }).success).toBe(false);
    expect(signInSchema.safeParse({}).success).toBe(false);
  });

  it("keeps an optional next path", () => {
    const result = signInSchema.safeParse({ email: "a@example.com", next: "/items/1" });
    expect(result.success && result.data.next).toBe("/items/1");
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
