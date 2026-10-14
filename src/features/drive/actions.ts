"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import { decryptToken } from "./crypto";
import { getDriveConfig } from "./config";
import { getDriveConnection, markDisconnected, saveRootFolder } from "./repository";
import { createFolder, getFolder, revokeGoogleToken } from "./google";
import { getUserDriveAccess } from "./access";
import { z } from "zod";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLocale, type Locale } from "@/i18n/config";

function localeFrom(formData: FormData): Locale { const value = String(formData.get("locale") ?? ""); return isLocale(value) ? value : "de"; }

export async function disconnectDriveAction(formData: FormData) {
  const locale = localeFrom(formData);
  const user = await requireUser(locale);
  const connection = await getDriveConnection(user.id);
  const config = getDriveConfig();
  if (connection?.refresh_token_ciphertext && config) {
    try { await revokeGoogleToken(await decryptToken(connection.refresh_token_ciphertext, config.TOKEN_ENCRYPTION_KEY)); } catch { /* Local state is still revoked; reconnection remains possible. */ }
  }
  await markDisconnected(user.id);
  redirect(`/${locale}/drive?disconnected=1`);
}

export async function createRootFolderAction(formData: FormData) {
  const locale = localeFrom(formData);
  const user = await requireUser(locale);
  const parsed = z.string().trim().min(1).max(120).refine((name) => !/[\\/:*?"<>|]/.test(name)).safeParse(formData.get("folderName"));
  if (!parsed.success || formData.get("confirm") !== "yes") redirect(`/${locale}/drive?error=invalid_folder_name`);
  let created = false;
  try {
    const { accessToken, connection } = await getUserDriveAccess(user.id);
    const admin = createAdminClient();
    if (!admin) throw new Error("drive_not_configured");
    const digest = createHash("sha256").update(parsed.data.normalize("NFKC")).digest("hex").slice(0, 24);
    const idempotencyKey = `${connection.id}:create_root:${digest}`;
    const { data: previous } = await admin.from("drive_operations").select("target_folder_id,status").eq("user_id", user.id).eq("idempotency_key", idempotencyKey).maybeSingle();
    const root = previous?.status === "completed" && previous.target_folder_id
      ? await getFolder(accessToken, previous.target_folder_id)
      : await createFolder(accessToken, "root", parsed.data);
    await admin.from("drive_operations").upsert({ user_id: user.id, connected_account_id: connection.id, idempotency_key: idempotencyKey, operation_type: "create_root", target_folder_id: root.id, parent_folder_id: "root", status: "completed", confirmed_at: new Date().toISOString(), completed_at: new Date().toISOString() }, { onConflict: "user_id,idempotency_key" });
    await saveRootFolder(user.id, { id: root.id, name: root.name });
    created = true;
  } catch { /* Redirect below keeps provider details out of the response. */ }
  redirect(created ? `/${locale}/drive?root=created` : `/${locale}/drive?error=root_creation`);
}
