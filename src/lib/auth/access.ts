import { safeRedirectPath } from "./redirect";

/** Reachable without a session. Everything else requires sign-in. */
const PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/auth/", "/manifest.webmanifest", "/sw.js", "/icons/", "/offline"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) =>
    prefix.endsWith("/") ? pathname.startsWith(prefix) : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Internal route of the public landing page. Reached only by a proxy rewrite from "/". */
export const LANDING_INTERNAL_PATH = "/welcome";

export type AccessDecision =
  | { type: "allow" }
  | { type: "redirect"; location: string }
  | { type: "rewrite"; location: string }
  | { type: "unconfigured" };

interface AccessInput {
  pathname: string;
  search: string;
  /** HTTP method. Required so Server Action POSTs to "/" are never rewritten to the landing. */
  method: string;
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
  const method = input.method.toUpperCase();

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

  // The landing has one public URL ("/"); direct hits on the internal route go there.
  if (pathname === LANDING_INTERNAL_PATH || pathname.startsWith(`${LANDING_INTERNAL_PATH}/`)) {
    return { type: "redirect", location: "/" };
  }

  if ((pathname === "/sign-in" || pathname === "/sign-up") && isAuthenticated) {
    return { type: "redirect", location: "/" };
  }

  if (pathname === "/" && !isAuthenticated && (method === "GET" || method === "HEAD")) {
    return { type: "rewrite", location: LANDING_INTERNAL_PATH };
  }
  if (isPublicPath(pathname)) return { type: "allow" };
  if (isAuthenticated) return { type: "allow" };

  const next = safeRedirectPath(`${pathname}${search}`);
  const location = next === "/" ? "/sign-in" : `/sign-in?next=${encodeURIComponent(next)}`;
  return { type: "redirect", location };
}
