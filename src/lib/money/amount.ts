import { majorToMinor, minorUnitDigits } from "./money";

export type AmountResult = { minor: number } | { error: "invalid" | "decimals" | "range" };

/**
 * Parses what a person types into minor units for a currency, understanding
 * both Indonesian ("12.500.000", "Rp 12.500.000") and English ("12,500,000",
 * "1,234.56") grouping. `maxMajor` is the largest allowed amount in whole units.
 *
 * Rules:
 * - Currencies with no decimals (IDR, JPY): every "." or "," is a thousands separator.
 * - Otherwise, when both separators appear the last one is the decimal point;
 *   a separator repeated several times is thousands; a single separator followed
 *   by exactly three digits is thousands ("1,234" is 1234); anything else is decimal.
 */
export function parseAmount(raw: string, currency: string, maxMajor: number): AmountResult {
  const digits = minorUnitDigits(currency);
  const cleaned = raw.trim().replace(/^rp\.?\s*/i, "").replace(/\s+/g, "");
  if (cleaned === "" || !/^[\d.,]+$/.test(cleaned) || !/\d/.test(cleaned)) return { error: "invalid" };

  let major: number;
  if (digits === 0) {
    if (!/^\d+$/.test(cleaned) && !/^\d{1,3}([.,]\d{3})+$/.test(cleaned)) {
      return { error: /^\d+[.,]\d{1,2}$/.test(cleaned) ? "decimals" : "invalid" };
    }
    major = Number(cleaned.replace(/[.,]/g, ""));
  } else {
    const lastDot = cleaned.lastIndexOf(".");
    const lastComma = cleaned.lastIndexOf(",");
    let decimalSeparator: "." | "," | null = null;

    if (lastDot !== -1 && lastComma !== -1) {
      decimalSeparator = lastDot > lastComma ? "." : ",";
    } else {
      const separator = lastDot !== -1 ? "." : lastComma !== -1 ? "," : null;
      if (separator !== null) {
        const occurrences = cleaned.split(separator).length - 1;
        const afterLast = cleaned.length - cleaned.lastIndexOf(separator) - 1;
        const looksLikeThousands = occurrences > 1 || (afterLast === 3 && digits !== 3);
        decimalSeparator = looksLikeThousands ? null : separator;
      }
    }

    const groupSeparator = decimalSeparator === "." ? /,/g : decimalSeparator === "," ? /\./g : /[.,]/g;
    const withoutGroups = cleaned.replace(groupSeparator, "");
    const normalised = decimalSeparator === null ? withoutGroups : withoutGroups.replace(decimalSeparator, ".");
    if (!/^\d+(\.\d+)?$/.test(normalised)) return { error: "invalid" };
    const decimals = normalised.split(".")[1]?.length ?? 0;
    if (decimals > digits) return { error: "decimals" };
    major = Number(normalised);
  }

  if (!Number.isFinite(major) || major > maxMajor) return { error: "range" };
  return { minor: majorToMinor(major, currency) };
}
