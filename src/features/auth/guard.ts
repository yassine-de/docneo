import type { Locale } from "@/i18n/config";

export function protectedRedirectFor(user: { id: string } | null, locale: Locale) {
  return user ? null : `/${locale}/login`;
}
