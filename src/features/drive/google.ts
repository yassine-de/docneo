import "server-only";

import { decryptToken, encryptToken } from "./crypto";
import { DRIVE_SCOPE, FOLDER_MIME_TYPE, getDriveConfig } from "./config";

export type GoogleTokens = { access_token: string; expires_in: number; refresh_token?: string; scope: string; token_type: string };
export type DriveFolder = { id: string; name: string; mimeType: string; parents?: string[]; driveId?: string; trashed?: boolean; capabilities?: { canAddChildren?: boolean; canListChildren?: boolean } };

async function googleRequest<T>(url: string, init: RequestInit, expected = 200): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  if (response.status !== expected) throw new Error(`google_api_${response.status}`);
  return response.json() as Promise<T>;
}

export function buildDriveAuthorizationUrl(input: { state: string; selectFolder?: boolean }) {
  const config = getDriveConfig();
  if (!config) throw new Error("drive_not_configured");
  const params = new URLSearchParams({ client_id: config.GOOGLE_CLIENT_ID, redirect_uri: config.GOOGLE_DRIVE_REDIRECT_URI, response_type: "code", scope: DRIVE_SCOPE, access_type: "offline", prompt: "consent", include_granted_scopes: "false", state: input.state });
  if (input.selectFolder) { params.set("trigger_onepick", "true"); params.set("allow_folder_selection", "true"); params.set("mimetypes", FOLDER_MIME_TYPE); }
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeAuthorizationCode(code: string): Promise<GoogleTokens> {
  const config = getDriveConfig();
  if (!config) throw new Error("drive_not_configured");
  const body = new URLSearchParams({ code, client_id: config.GOOGLE_CLIENT_ID, client_secret: config.GOOGLE_CLIENT_SECRET, redirect_uri: config.GOOGLE_DRIVE_REDIRECT_URI, grant_type: "authorization_code" });
  const tokens = await googleRequest<GoogleTokens>("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
  const scopes = new Set(tokens.scope.split(/\s+/));
  if (!scopes.has(DRIVE_SCOPE) || [...scopes].some((scope) => scope === "https://www.googleapis.com/auth/drive" || scope === "https://www.googleapis.com/auth/drive.readonly")) throw new Error("unexpected_drive_scope");
  return tokens;
}

export async function refreshAccessToken(refreshTokenCiphertext: string) {
  const config = getDriveConfig();
  if (!config) throw new Error("drive_not_configured");
  const refreshToken = await decryptToken(refreshTokenCiphertext, config.TOKEN_ENCRYPTION_KEY);
  const body = new URLSearchParams({ refresh_token: refreshToken, client_id: config.GOOGLE_CLIENT_ID, client_secret: config.GOOGLE_CLIENT_SECRET, grant_type: "refresh_token" });
  return googleRequest<GoogleTokens>("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
}

export async function encryptGoogleTokens(tokens: GoogleTokens) {
  const config = getDriveConfig();
  if (!config) throw new Error("drive_not_configured");
  return { access: await encryptToken(tokens.access_token, config.TOKEN_ENCRYPTION_KEY), refresh: tokens.refresh_token ? await encryptToken(tokens.refresh_token, config.TOKEN_ENCRYPTION_KEY) : null };
}

export async function getDriveUser(accessToken: string) {
  return googleRequest<{ user: { permissionId: string; emailAddress?: string; displayName?: string } }>("https://www.googleapis.com/drive/v3/about?fields=user(permissionId,emailAddress,displayName)", { headers: { authorization: `Bearer ${accessToken}` } });
}

export async function getFolder(accessToken: string, folderId: string): Promise<DriveFolder> {
  if (!/^[A-Za-z0-9_-]{10,255}$/.test(folderId)) throw new Error("invalid_folder_id");
  const fields = "id,name,mimeType,parents,driveId,trashed,capabilities(canAddChildren,canListChildren)";
  const folder = await googleRequest<DriveFolder>(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}?fields=${encodeURIComponent(fields)}&supportsAllDrives=false`, { headers: { authorization: `Bearer ${accessToken}` } });
  if (folder.mimeType !== FOLDER_MIME_TYPE || folder.trashed || folder.driveId || !folder.capabilities?.canAddChildren) throw new Error("unsupported_root_folder");
  return folder;
}

export async function findChildFolder(accessToken: string, parentId: string, name: string) {
  const escaped = name.replace(/'/g, "\\'");
  const q = `'${parentId}' in parents and name = '${escaped}' and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`;
  const result = await googleRequest<{ files: DriveFolder[] }>(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&spaces=drive&pageSize=10&fields=files(id,name,mimeType,parents,driveId,trashed,capabilities(canAddChildren,canListChildren))`, { headers: { authorization: `Bearer ${accessToken}` } });
  return result.files.find((folder) => folder.parents?.includes(parentId)) ?? null;
}

export async function createFolder(accessToken: string, parentId: string, name: string) {
  return googleRequest<DriveFolder>("https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,parents", { method: "POST", headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" }, body: JSON.stringify({ name, mimeType: FOLDER_MIME_TYPE, parents: [parentId] }) }, 200);
}

export async function revokeGoogleToken(token: string) {
  const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, cache: "no-store" });
  if (!response.ok && response.status !== 400) throw new Error("google_revoke_failed");
}
