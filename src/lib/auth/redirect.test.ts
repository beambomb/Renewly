import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it("allows same-site relative paths with query strings", () => {
    expect(safeRedirectPath("/")).toBe("/");
    expect(safeRedirectPath("/items/123")).toBe("/items/123");
    expect(safeRedirectPath("/?kind=warranty&q=tv")).toBe("/?kind=warranty&q=tv");
  });

  it("falls back for missing values", () => {
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath(undefined)).toBe("/");
    expect(safeRedirectPath("")).toBe("/");
    expect(safeRedirectPath("", "/alerts")).toBe("/alerts");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeRedirectPath("https://evil.example")).toBe("/");
    expect(safeRedirectPath("//evil.example")).toBe("/");
    expect(safeRedirectPath("/\\evil.example")).toBe("/");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/");
    expect(safeRedirectPath("evil.example/path")).toBe("/");
  });

  it("rejects control characters and encoded slashes", () => {
    expect(safeRedirectPath("/\n//evil.example")).toBe("/");
    expect(safeRedirectPath("/%2Fevil.example")).toBe("/");
    expect(safeRedirectPath("/%5cevil.example")).toBe("/");
  });
});
