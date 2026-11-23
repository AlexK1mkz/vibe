import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/server-utils";
import { currentSite } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const site = currentSite();
  const client = ["", "/test", "/consultation", "/intensive"];
  const paths = site === "specialists" ? [""] : site === "client" ? client : [...client, "/specialists"];
  return [...paths, "/privacy", "/offer"].map((path) => ({
    url: base + path,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.6,
  }));
}
