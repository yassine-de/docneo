import "server-only";

import { decryptToken, encryptToken } from "./crypto";
import { getDriveConfig } from "./config";
import { refreshAccessToken } from "./google";
import { getDriveConnection, markReconnectRequired, updateAccessToken } from "./repository";

export async function getUserDriveAccess(userId: string) {
  const config = getDriveConfig(); const connection = await getDriveConnection(userId);
  if (!config || !connection) throw new Error("drive_not_connected");
  if (connection.status === "reconnect_required") throw new Error("drive_reconnect_required");
  if (connection.status !== "active") throw new Error("drive_not_connected");
  if (connection.access_token_ciphertext && connection.expires_at && Date.parse(connection.expires_at) > Date.now() + 60_000) return { connection, accessToken: await decryptToken(connection.access_token_ciphertext, config.TOKEN_ENCRYPTION_KEY) };
  if (!connection.refresh_token_ciphertext) throw new Error("drive_reconnect_required");
  try {
    const refreshed = await refreshAccessToken(connection.refresh_token_ciphertext);
    const ciphertext = await encryptToken(refreshed.access_token, config.TOKEN_ENCRYPTION_KEY);
    const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
    await updateAccessToken(userId, ciphertext, expiresAt);
    return { connection: { ...connection, access_token_ciphertext: ciphertext, expires_at: expiresAt }, accessToken: refreshed.access_token };
  } catch {
    try { await markReconnectRequired(userId); } catch { /* Preserve the safe reconnect response even if status persistence fails. */ }
    throw new Error("drive_reconnect_required");
  }
}
