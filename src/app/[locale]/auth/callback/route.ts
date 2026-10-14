import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { isLocale } from "@/i18n/config";
import { safeNextPath } from "@/features/auth/safe-redirect";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

const otpTypes = new Set<EmailOtpType>(["email", "signup", "recovery", "invite", "magiclink", "email_change"]);

export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "de";
  const url = new URL(request.url);
  const config = getSupabasePublicConfig();
  const applyAuthState: Array<(response: NextResponse) => void> = [];
  const supabase = config ? createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        applyAuthState.push((response) => {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
        });
      },
    },
  }) : null;
  let succeeded = false;
  let recovery = false;

  if (supabase) {
    const tokenHash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type") as EmailOtpType | null;
    const code = url.searchParams.get("code");
    recovery = type === "recovery";
    if (tokenHash && type && otpTypes.has(type)) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      succeeded = !error;
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      succeeded = !error;
    }
  }

  const requested = safeNextPath(url.searchParams.get("next"), locale, recovery ? `/${locale}/reset-password` : `/${locale}/dashboard`);
  const target = succeeded ? requested : `/${locale}/login?error=auth_callback`;
  const response = NextResponse.redirect(new URL(target, url.origin));
  applyAuthState.forEach((apply) => apply(response));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
