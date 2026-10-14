import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getOptionalUser } from "@/features/auth/session";
import { encryptGoogleTokens, exchangeAuthorizationCode, getDriveUser, getFolder } from "@/features/drive/google";
import { saveDriveConnection } from "@/features/drive/repository";
import { isLocale, type Locale } from "@/i18n/config";

function sameState(left: string, right: string) {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const expected = request.cookies.get("docneo_drive_oauth_state")?.value ?? "";
  const parts = expected.split(".");
  const locale: Locale = isLocale(parts[1]) ? parts[1] : "de";
  const finish = (path: string) => { const response = NextResponse.redirect(new URL(`/${locale}/drive${path}`, request.url)); response.cookies.set("docneo_drive_oauth_state", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/drive/callback", maxAge: 0 }); response.headers.set("Cache-Control", "private, no-store"); return response; };
  if (!state || !expected || !sameState(state, expected)) return finish("?error=invalid_state");
  if (request.nextUrl.searchParams.has("error")) return finish("?error=cancelled");
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return finish("?error=invalid_callback");
  const user = await getOptionalUser();
  if (!user) return finish("?error=session");
  try {
    const tokens = await exchangeAuthorizationCode(code);
    const [driveUser, encrypted] = await Promise.all([getDriveUser(tokens.access_token), encryptGoogleTokens(tokens)]);
    const picked = request.nextUrl.searchParams.get("picked_file_ids")?.split(",").filter(Boolean) ?? [];
    if (picked.length > 1) return finish("?error=folder_selection");
    const root = picked[0] ? await getFolder(tokens.access_token, picked[0]) : undefined;
    await saveDriveConnection({ userId: user.id, providerSubject: driveUser.user.permissionId, providerEmail: driveUser.user.emailAddress, scopes: tokens.scope.split(/\s+/), accessCiphertext: encrypted.access, refreshCiphertext: encrypted.refresh, expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(), root: root ? { id: root.id, name: root.name } : undefined });
    return finish(root ? "?connected=1&root=selected" : "?connected=1");
  } catch { return finish("?error=authorization"); }
}
