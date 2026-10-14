import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type DriveConnection = {
  id: string; user_id: string; provider_subject: string; provider_email: string | null; status: "active" | "reconnect_required" | "revoked";
  granted_scopes: string[]; access_token_ciphertext: string | null; refresh_token_ciphertext: string | null; expires_at: string | null;
  root_folder_id: string | null; root_folder_name: string | null; pending_folder_id: string | null; setup_status: "root_required" | "onboarding" | "confirmation" | "complete";
};

export async function getDriveConnection(userId: string) {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data, error } = await admin.from("connected_accounts").select("id,user_id,provider_subject,provider_email,status,granted_scopes,access_token_ciphertext,refresh_token_ciphertext,expires_at,root_folder_id,root_folder_name,pending_folder_id,setup_status").eq("user_id", userId).eq("provider", "google_drive").maybeSingle();
  if (error) return null;
  return data as DriveConnection | null;
}

export async function saveDriveConnection(input: { userId: string; providerSubject: string; providerEmail?: string; scopes: string[]; accessCiphertext: string; refreshCiphertext: string | null; expiresAt: string; root?: { id: string; name: string } }) {
  const admin = createAdminClient();
  if (!admin) throw new Error("drive_not_configured");
  const existing = await getDriveConnection(input.userId);
  const values = { user_id: input.userId, provider: "google_drive", provider_subject: input.providerSubject, provider_email: input.providerEmail ?? null, status: "active", granted_scopes: input.scopes, access_token_ciphertext: input.accessCiphertext, refresh_token_ciphertext: input.refreshCiphertext ?? existing?.refresh_token_ciphertext ?? null, expires_at: input.expiresAt, last_error_code: null };
  const { data: saved, error } = await admin.from("connected_accounts").upsert(values, { onConflict: "user_id,provider" }).select("id").single();
  if (error) throw new Error("drive_connection_save_failed");
  if (input.root) {
    const { error: rootError } = await admin.rpc("change_drive_root", { requested_user_id: input.userId, requested_account_id: saved.id, requested_root_folder_id: input.root.id, requested_root_folder_name: input.root.name });
    if (rootError) throw new Error("drive_root_save_failed");
  }
}

export async function markDisconnected(userId: string) {
  const admin = createAdminClient();
  if (!admin) throw new Error("drive_not_configured");
  const { error } = await admin.from("connected_accounts").update({ status: "revoked", access_token_ciphertext: null, refresh_token_ciphertext: null, expires_at: null, disconnected_at: new Date().toISOString() }).eq("user_id", userId).eq("provider", "google_drive");
  if (error) throw new Error("drive_disconnect_failed");
}

export async function updateAccessToken(userId: string, ciphertext: string, expiresAt: string) {
  const admin = createAdminClient();
  if (!admin) throw new Error("drive_not_configured");
  const { error } = await admin.from("connected_accounts").update({ access_token_ciphertext: ciphertext, expires_at: expiresAt, status: "active", last_error_code: null }).eq("user_id", userId).eq("provider", "google_drive");
  if (error) throw new Error("drive_token_update_failed");
}

export async function markReconnectRequired(userId: string) {
  const admin = createAdminClient();
  if (!admin) throw new Error("drive_not_configured");
  const { error } = await admin.from("connected_accounts").update({
    status: "reconnect_required",
    access_token_ciphertext: null,
    refresh_token_ciphertext: null,
    expires_at: null,
    last_error_code: "google_authorization_invalid",
  }).eq("user_id", userId).eq("provider", "google_drive");
  if (error) throw new Error("drive_reconnect_state_failed");
}

export async function saveRootFolder(userId: string, root: { id: string; name: string }) {
  const admin = createAdminClient();
  if (!admin) throw new Error("drive_not_configured");
  const connection = await getDriveConnection(userId);
  if (!connection) throw new Error("drive_not_connected");
  const { error } = await admin.rpc("change_drive_root", { requested_user_id: userId, requested_account_id: connection.id, requested_root_folder_id: root.id, requested_root_folder_name: root.name });
  if (error) throw new Error("drive_root_save_failed");
}
