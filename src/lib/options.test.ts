import { describe, expect, it } from "vitest";
import { currencyOptions, timeZoneOptions } from "./options";

describe("select options", () => {
  it("lists time zones, always including UTC and the current value", () => {
    const options = timeZoneOptions("Europe/Berlin");
    const values = options.map((o) => o.value);
    expect(values).toContain("UTC");
    expect(values).toContain("Europe/Berlin");
    expect(values).toContain("America/New_York");
    expect(new Set(values).size).toBe(values.length);
    expect(options.find((o) => o.value === "America/New_York")?.label).toBe("America/New York");
  });

  it("lists currencies with readable names", () => {
    const options = currencyOptions();
    expect(options.find((o) => o.value === "EUR")?.label).toBe("EUR - Euro");
    expect(options.find((o) => o.value === "USD")?.label).toContain("US Dollar");
    expect(options.length).toBeGreaterThan(100);
  });
});
