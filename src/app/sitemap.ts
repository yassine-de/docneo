import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return ["de", "fr"].map((locale) => ({
    url: `${base}/${locale}`,
    lastModified: new Date("2026-10-14"),
    changeFrequency: "monthly" as const,
    priority: 1,
    alternates: { languages: { de: `${base}/de`, fr: `${base}/fr` } },
  }));
}
