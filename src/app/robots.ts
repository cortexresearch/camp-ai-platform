import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nothing here is secret — these paths are either behind auth or
        // useless in an index. Keeping them out stops crawl budget being spent
        // on login forms and one-time reset links.
        disallow: ["/admin", "/api/", "/login", "/signup", "/forgot-password", "/reset-password"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
