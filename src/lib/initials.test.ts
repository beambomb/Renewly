import { describe, expect, it } from "vitest";
import { initialsOf } from "./initials";

describe("initialsOf", () => {
  it("uses the first letters of the first two words", () => {
    expect(initialsOf("Amazon Prime")).toBe("AP");
    expect(initialsOf("water filter cartridge")).toBe("WF");
  });

  it("uses the first two letters of a single word", () => {
    expect(initialsOf("Netflix")).toBe("NE");
    expect(initialsOf("X")).toBe("X");
  });

  it("ignores punctuation, extra spaces and leading symbols", () => {
    expect(initialsOf("  [demo]   Coffee  beans ")).toBe("DC");
    expect(initialsOf("--- ---")).toBe("?");
  });

  it("handles empty and non-latin names", () => {
    expect(initialsOf("")).toBe("?");
    expect(initialsOf("   ")).toBe("?");
    expect(initialsOf("音楽 サービス")).toBe("音サ");
  });
});
