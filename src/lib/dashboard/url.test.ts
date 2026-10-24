import { describe, expect, it } from "vitest";
import { filtersFromParams, hrefFor } from "./url";

describe("filtersFromParams", () => {
  it("reads valid filters", () => {
    expect(filtersFromParams({ section: "savings", category: " Music ", q: " netflix " })).toEqual({
      section: "savings",
      category: "Music",
      query: "netflix",
    });
  });

  it("ignores unknown sections and empty values", () => {
    expect(filtersFromParams({ section: "gadgets", category: "", q: "   " })).toEqual({
      section: null,
      category: null,
      query: null,
    });
    expect(filtersFromParams({})).toEqual({ section: null, category: null, query: null });
  });

  it("takes the first of repeated parameters and caps lengths", () => {
    expect(filtersFromParams({ section: ["reminder", "savings"] }).section).toBe("reminder");
    expect(filtersFromParams({ q: "x".repeat(500) }).query?.length).toBe(100);
  });
});

describe("hrefFor", () => {
  it("builds a URL and encodes values", () => {
    expect(hrefFor({})).toBe("/");
    expect(hrefFor({ section: "warranty" })).toBe("/?section=warranty");
    expect(hrefFor({ section: "subscription", category: "Food & Drink", query: "meal box" })).toBe(
      "/?section=subscription&category=Food+%26+Drink&q=meal+box",
    );
  });

  it("round-trips through the parser", () => {
    const filters = { section: "recurring" as const, category: "Café", query: "beans & more" };
    const url = new URL(hrefFor(filters), "http://x");
    expect(filtersFromParams(Object.fromEntries(url.searchParams))).toEqual(filters);
  });
});
