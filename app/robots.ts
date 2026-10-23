import type { MetadataRoute } from "next";
import { siteUrl } from "./site-url";

// Private workspaces, invitation rooms and internal QA routes stay out of search.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/api", "/login", "/onboarding", "/enter", "/viewing", "/editor-preview-test", "/__editor-preview-test", "/artist-design-qa", "/__artist-design-qa", "/ux-check"],
    }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
