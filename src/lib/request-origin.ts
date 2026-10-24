/**
 * The public origin (scheme + host) of the current request, so auth links point
 * back to wherever the app is running, with no extra configuration.
 *
 * Supabase still decides where it will redirect: only URLs on its allow list
 * (Authentication > URL Configuration) are honoured, so a forged Host header
 * cannot send a sign-in link to another site.
 */
export function originFromHeaders(headers: {
  host?: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
}): string | null {
  const host = (headers.forwardedHost ?? headers.host ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  // hostname with an optional port; nothing that could break out of a URL
  if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\d{1,5})?$/.test(host)) return null;

  const hostname = host.split(":")[0] ?? "";
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
  const proto = (headers.forwardedProto ?? "").split(",")[0]?.trim().toLowerCase();
  const scheme = proto === "http" || proto === "https" ? proto : isLocal ? "http" : "https";
  return `${scheme}://${host}`;
}
