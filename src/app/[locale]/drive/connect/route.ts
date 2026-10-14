import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getOptionalUser } from "@/features/auth/session";
import { buildDriveAuthorizationUrl } from "@/features/drive/google";
import { isLocale } from "@/i18n/config";

export async function GET(request: NextRequest, context: { params: Promise<{ locale: string }> }) {
  const { locale } = await context.params;
  if (!isLocale(locale)) return NextResponse.redirect(new URL("/de/login", request.url));
  const user = await getOptionalUser();
  if (!user) return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  const intent = request.nextUrl.searchParams.get("mode") === "connect" ? "connect" : "select";
  const state = `${randomBytes(32).toString("base64url")}.${locale}.${intent}`;
  let authorizationUrl: string;
  try { authorizationUrl = buildDriveAuthorizationUrl({ state, selectFolder: intent === "select" }); }
  catch { return NextResponse.redirect(new URL(`/${locale}/drive?error=configuration`, request.url)); }
  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set("docneo_drive_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/drive/callback", maxAge: 600 });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
