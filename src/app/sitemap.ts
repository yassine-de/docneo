import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return ["de", "fr"].map((locale) => ({
    url: `${base}/${locale}`,
    lastModified: new Date("2026-10-14"),
    changeFrequency: "monthly" as const,
    priority: 1,
    alternates: { languages: { de: `${base}/de`, fr: `${base}/fr` } },
  }));
}
