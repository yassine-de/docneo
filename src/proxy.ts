import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, locales } from "@/i18n/config";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";

function preferredLocale(request: NextRequest) {
  const languages = request.headers.get("accept-language")?.toLowerCase() ?? "";
  return languages.split(",").some((language) => language.trim().startsWith("fr"))
    ? "fr"
    : defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  if (hasLocale) return refreshSupabaseSession(request);

  const url = request.nextUrl.clone();
  url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)"],
};
