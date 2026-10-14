import type { Locale } from "@/i18n/config";
import { safeNextPath } from "./safe-redirect";

export const GOOGLE_IDENTITY_SCOPES = "openid email profile";

export function googleOAuthRedirectTo(origin: string, locale: Locale, next?: string) {
  const callback = new URL(`/${locale}/auth/callback`, origin);
  callback.searchParams.set("next", safeNextPath(next ?? null, locale));
  return callback.toString();
}
