import { safeRedirectPath } from "./redirect";

/** Reachable without a session. Everything else requires sign-in. */
const PUBLIC_PREFIXES = ["/sign-in", "/auth/", "/manifest.webmanifest", "/sw.js", "/icons/", "/offline"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) =>
    prefix.endsWith("/") ? pathname.startsWith(prefix) : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export type AccessDecision =
  | { type: "allow" }
  | { type: "redirect"; location: string }
  | { type: "unconfigured" };

interface AccessInput {
  pathname: string;
  search: string;
  isAuthenticated: boolean;
  supabaseConfigured: boolean;
  isDevelopment: boolean;
}

/**
 * Decides what the proxy does with a request. Fails closed: with no Supabase
 * configuration nothing is served, except /dev/* pages in development.
 */
export function decideAccess(input: AccessInput): AccessDecision {
  const { pathname, search, isAuthenticated, supabaseConfigured, isDevelopment } = input;

  // Development-only preview pages (never reachable in production builds).
  if (isDevelopment && (pathname === "/dev" || pathname.startsWith("/dev/"))) return { type: "allow" };

  if (!supabaseConfigured) return { type: "unconfigured" };

  // If the callback URL is not in Supabase's Redirect URLs list, Supabase sends the
  // person to the site root with ?code=... Pass it on to the login handler.
  if (pathname === "/") {
    const code = new URLSearchParams(search).get("code");
    if (code && code.length <= 500) {
      return { type: "redirect", location: `/auth/callback?code=${encodeURIComponent(code)}` };
    }
  }

  if (pathname === "/sign-in" && isAuthenticated) {
    return { type: "redirect", location: "/" };
  }
  if (isPublicPath(pathname)) return { type: "allow" };
  if (isAuthenticated) return { type: "allow" };

  const next = safeRedirectPath(`${pathname}${search}`);
  const location = next === "/" ? "/sign-in" : `/sign-in?next=${encodeURIComponent(next)}`;
  return { type: "redirect", location };
}
