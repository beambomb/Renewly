import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // A stray lockfile above this repo confuses root detection; pin it here.
  turbopack: { root: process.cwd() },
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: buildSecurityHeaders({
          isDev: process.env.NODE_ENV !== "production",
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        }),
      },
    ];
  },
};

export default nextConfig;
