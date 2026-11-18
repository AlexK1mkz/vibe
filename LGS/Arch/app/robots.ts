import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/server-utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/result/", "/api/", "/thanks", "/unsubscribe/"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
