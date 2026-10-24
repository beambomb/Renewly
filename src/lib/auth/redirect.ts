/**
 * Only same-site relative paths may be used as a post-login destination, so
 * the `next` parameter cannot be used as an open redirect.
 */
export function safeRedirectPath(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  // "//evil.com" and "/\evil.com" are treated as absolute URLs by browsers.
  if (next.startsWith("//") || next.includes("\\")) return fallback;
  // Control characters and encoded slashes/backslashes at the start are suspicious.
  for (const char of next) {
    const code = char.codePointAt(0) ?? 0;
    if (code <= 0x1f || code === 0x7f) return fallback;
  }
  if (/^\/(%2f|%5c)/i.test(next)) return fallback;
  return next;
}
