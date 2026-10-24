import { describe, expect, it } from "vitest";
import {
  currencySchema,
  parseSettingsForm,
  profileFromRow,
  reminderOffsetsSchema,
  timezoneSchema,
} from "./profile";

function form(entries: Array<[string, string]>): FormData {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

describe("timezoneSchema", () => {
  it("accepts IANA names and rejects others", () => {
    expect(timezoneSchema.safeParse("Europe/Berlin").success).toBe(true);
    expect(timezoneSchema.safeParse("UTC").success).toBe(true);
    expect(timezoneSchema.safeParse("Mars/Olympus").success).toBe(false);
    expect(timezoneSchema.safeParse("").success).toBe(false);
    expect(timezoneSchema.safeParse("x".repeat(65)).success).toBe(false);
  });
});

describe("currencySchema", () => {
  it("accepts known ISO codes in any case", () => {
    const result = currencySchema.safeParse(" eur ");
    expect(result.success && result.data).toBe("EUR");
    expect(currencySchema.safeParse("JPY").success).toBe(true);
  });

  it("rejects unknown or malformed codes", () => {
    for (const code of ["", "US", "USDX", "ZZZ", "12A"]) {
      expect(currencySchema.safeParse(code).success).toBe(false);
    }
  });
});

describe("reminderOffsetsSchema", () => {
  it("coerces strings, removes duplicates and sorts largest first", () => {
    const result = reminderOffsetsSchema.safeParse(["1", "7", "7", "0", "3"]);
    expect(result.success && result.data).toEqual([7, 3, 1, 0]);
  });

  it("allows no reminders", () => {
    const result = reminderOffsetsSchema.safeParse([]);
    expect(result.success && result.data).toEqual([]);
  });

  it("rejects negatives, fractions, too large values and more than 10", () => {
    expect(reminderOffsetsSchema.safeParse(["-1"]).success).toBe(false);
    expect(reminderOffsetsSchema.safeParse(["1.5"]).success).toBe(false);
    expect(reminderOffsetsSchema.safeParse(["366"]).success).toBe(false);
    expect(reminderOffsetsSchema.safeParse(Array.from({ length: 11 }, (_, i) => String(i))).success).toBe(false);
  });
});

describe("parseSettingsForm", () => {
  it("parses a complete form", () => {
    const result = parseSettingsForm(
      form([
        ["timezone", "Pacific/Auckland"],
        ["defaultCurrency", "nzd"],
        ["offsets", "14"],
        ["offsets", "1"],
        ["emailEnabled", "on"],
      ]),
    );
    expect(result).toEqual({
      success: true,
      data: { timezone: "Pacific/Auckland", defaultCurrency: "NZD", reminderOffsets: [14, 1], emailEnabled: true },
    });
  });

  it("treats an unchecked email box as false", () => {
    const result = parseSettingsForm(form([["timezone", "UTC"], ["defaultCurrency", "USD"]]));
    expect(result.success && result.data.emailEnabled).toBe(false);
  });

  it("returns one error per field, keyed by the input id", () => {
    const result = parseSettingsForm(
      form([
        ["timezone", "Nowhere/City"],
        ["defaultCurrency", "ZZZ"],
        ["offsets", "999"],
      ]),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.map((e) => e.field)).toEqual(["timezone", "defaultCurrency", "offsets"]);
      expect(result.errors.every((e) => e.message.length > 0)).toBe(true);
    }
  });

  it("ignores File values by stringifying safely", () => {
    const data = new FormData();
    data.append("timezone", new File(["x"], "x.txt"));
    data.append("defaultCurrency", "USD");
    expect(parseSettingsForm(data).success).toBe(false);
  });
});

describe("profileFromRow", () => {
  it("maps database columns to the profile shape", () => {
    expect(
      profileFromRow({
        timezone: "UTC",
        default_currency: "USD",
        reminder_offsets: [7, 3, 1, 0],
        email_enabled: true,
        push_enabled: false,
      }),
    ).toEqual({ timezone: "UTC", defaultCurrency: "USD", reminderOffsets: [7, 3, 1, 0], emailEnabled: true, pushEnabled: false });
  });

  it("throws on a malformed row", () => {
    expect(() => profileFromRow({ timezone: 5 })).toThrow();
  });
});
