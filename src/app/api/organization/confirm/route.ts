import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getOptionalUser } from "@/features/auth/session";
import { getUserDriveAccess } from "@/features/drive/access";
import { createFolder, findChildFolder, getFolder } from "@/features/drive/google";
import { PENDING_FOLDER_ID, PENDING_FOLDER_NAME, validateFolderStructure } from "@/features/organization/generator";
import { usageKinds, type FolderNode } from "@/features/organization/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "node:crypto";

const nodeSchema = z.object({ id: z.string().min(1).max(100), name: z.string().trim().min(1).max(120), parentId: z.string().max(100).nullable(), category: z.enum([...usageKinds, "system"]), entityIndex: z.number().int().min(0).max(9).optional(), specialType: z.literal("pending_documents").optional(), creationStatus: z.enum(["proposed", "existing", "created", "failed"]), position: z.number().int().min(0).max(200) });
const bodySchema = z.object({ locale: z.enum(["de", "fr"]), answers: z.record(z.string(), z.unknown()), nodes: z.array(nodeSchema).min(1).max(120) });

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  const user = await getOptionalUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || JSON.stringify(parsed.data.answers).length > 20_000 || validateFolderStructure(parsed.data.nodes as FolderNode[]).length) return NextResponse.json({ error: "invalid_structure" }, { status: 400 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "migration_required" }, { status: 503 });
  try {
    const { connection, accessToken } = await getUserDriveAccess(user.id);
    if (!connection.root_folder_id || !connection.root_folder_name) return NextResponse.json({ error: "root_required" }, { status: 409 });
    await getFolder(accessToken, connection.root_folder_id);
    const existing = await findChildFolder(accessToken, connection.root_folder_id, PENDING_FOLDER_NAME);
    const pending = existing ?? await createFolder(accessToken, connection.root_folder_id, PENDING_FOLDER_NAME);
    if (!pending.parents?.includes(connection.root_folder_id)) throw new Error("root_boundary_violation");
    const rootDigest = createHash("sha256").update(connection.root_folder_id).digest("hex").slice(0, 24);
    const operationKey = `${connection.id}:setup:${rootDigest}`;
    const { error: preferenceError } = await admin.from("organization_preferences").upsert({ user_id: user.id, answers: parsed.data.answers, setup_status: "complete", setup_completed_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (preferenceError) throw preferenceError;
    const { error: draftError } = await admin.from("folder_structure_drafts").upsert({ user_id: user.id, connected_account_id: connection.id, structure: parsed.data.nodes, status: "confirmed", confirmed_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (draftError) throw draftError;
    const { error: folderError } = await admin.from("destination_folders").upsert({ user_id: user.id, connected_account_id: connection.id, provider_folder_id: pending.id, parent_provider_folder_id: connection.root_folder_id, display_name: PENDING_FOLDER_NAME, display_path: `${connection.root_folder_name}/${PENDING_FOLDER_NAME}`, authorization_source: existing ? "picker" : "app_created", special_type: "pending_documents", is_active: true }, { onConflict: "user_id,connected_account_id,provider_folder_id" });
    if (folderError) throw folderError;
    const { error: operationError } = await admin.from("drive_operations").upsert({ user_id: user.id, connected_account_id: connection.id, idempotency_key: operationKey, operation_type: existing ? "reuse_folder" : "create_folder", target_folder_id: pending.id, parent_folder_id: connection.root_folder_id, status: "completed", confirmed_at: new Date().toISOString(), completed_at: new Date().toISOString() }, { onConflict: "user_id,idempotency_key" });
    if (operationError) throw operationError;
    const { error: setupError } = await admin.from("connected_accounts").update({ pending_folder_id: pending.id, setup_status: "complete" }).eq("id", connection.id).eq("user_id", user.id);
    if (setupError) throw setupError;
    return NextResponse.json({ ok: true, pendingFolder: PENDING_FOLDER_ID }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "drive_reconnect_required") return NextResponse.json({ error: code }, { status: 409, headers: { "Cache-Control": "private, no-store" } });
    return NextResponse.json({ error: "confirmation_failed" }, { status: 502, headers: { "Cache-Control": "private, no-store" } });
  }
}
