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

  if (!supabaseConfigured) {
    if (isDevelopment && (pathname === "/dev" || pathname.startsWith("/dev/"))) return { type: "allow" };
    return { type: "unconfigured" };
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
