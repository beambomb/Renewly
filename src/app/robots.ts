import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/sign-in", "/sign-up", "/auth/", "/alerts", "/settings", "/add", "/items/", "/dev/"],
    },
  };
}
