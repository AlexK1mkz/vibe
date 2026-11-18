import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/server-utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return ["", "/test", "/consultation", "/intensive", "/specialists", "/privacy", "/offer"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.6,
  }));
}
