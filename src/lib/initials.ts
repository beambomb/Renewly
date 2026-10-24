/** Up to two uppercase letters for an item's logo fallback. */
export function initialsOf(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .map((word) => Array.from(word).filter((ch) => /[\p{L}\p{N}]/u.test(ch)).join(""))
    .filter((word) => word.length > 0);

  if (words.length === 0) return "?";
  const first = words[0] as string;
  if (words.length === 1) return Array.from(first).slice(0, 2).join("").toUpperCase();
  const second = words[1] as string;
  return (Array.from(first)[0] + Array.from(second)[0]).toUpperCase();
}
