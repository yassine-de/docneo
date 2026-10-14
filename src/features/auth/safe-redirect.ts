import type { Locale } from "@/i18n/config";

const allowed = new Set(["dashboard", "documents", "settings", "reset-password"]);

export function safeNextPath(value: string | null, locale: Locale, fallback = `/${locale}/dashboard`) {
  if (!value || value.startsWith("//") || !value.startsWith(`/${locale}/`)) return fallback;
  const firstSegment = value.slice(locale.length + 2).split(/[/?#]/, 1)[0];
  return allowed.has(firstSegment) ? value : fallback;
}
