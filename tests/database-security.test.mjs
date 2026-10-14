import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const migrationsDirectory = new URL("../supabase/migrations/", import.meta.url);
const initialUrl = new URL("202610140001_initial_schema.sql", migrationsDirectory);
const phase3Url = new URL("202610140002_phase3_auth_profiles.sql", migrationsDirectory);
const phase4Url = new URL("202610140003_phase4_drive_organization.sql", migrationsDirectory);

const futureTables = [
  "connected_accounts",
  "organizational_entities",
  "destination_folders",
  "organization_rules",
  "processing_jobs",
  "document_metadata",
  "audit_events",
  "subscriptions",
];

test("database migrations have a deterministic additive phase order", async () => {
  const migrations = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql")).sort();
  assert.deepEqual(migrations, [
    "202610140001_initial_schema.sql",
    "202610140002_phase3_auth_profiles.sql",
    "202610140003_phase4_drive_organization.sql",
  ]);
});

test("Phase 4 tables stay server-only and owner-bound", async () => {
  const sql = await readFile(phase4Url, "utf8");
  for (const table of ["organization_preferences", "onboarding_sessions", "folder_structure_drafts", "drive_operations", "document_actions"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    assert.match(sql, new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated`, "i"));
    assert.match(sql, new RegExp(`grant all on table public\\.${table} to service_role`, "i"));
  }
  for (const constraint of ["folder_drafts_account_owner_fk", "drive_operations_account_owner_fk", "document_actions_document_owner_fk", "document_actions_folder_owner_fk"]) {
    assert.match(sql, new RegExp(`constraint ${constraint} foreign key \\([^)]*, user_id\\)[\\s\\S]*?references public\\.`, "i"));
  }
  assert.doesNotMatch(sql, /\b(?:drop table|truncate table|delete from)\b/i);
});

test("Phase 4 enforces one active pending system folder inside the owner's selected root", async () => {
  const sql = await readFile(phase4Url, "utf8");
  assert.match(sql, /constraint pending_folder_shape[\s\S]*display_name = '00_UNERLEDIGT'[\s\S]*parent_provider_folder_id is not null[\s\S]*entity_id is null[\s\S]*is_active = true/i);
  assert.match(sql, /unique index destination_one_active_pending_per_account[\s\S]*\(user_id, connected_account_id\)[\s\S]*special_type = 'pending_documents' and is_active = true/i);
  assert.match(sql, /constraint connected_accounts_pending_folder_fk[\s\S]*foreign key \([\s\S]*user_id,[\s\S]*id,[\s\S]*pending_folder_id,[\s\S]*root_folder_id,[\s\S]*pending_folder_type,[\s\S]*pending_folder_active,[\s\S]*pending_folder_name[\s\S]*references public\.destination_folders/i);
  assert.match(sql, /constraint connected_accounts_complete_setup[\s\S]*setup_status <> 'complete' or \(root_folder_id is not null and pending_folder_id is not null\)/i);
});

test("Phase 4 rejects incomplete confirmations and invalid completed states", async () => {
  const sql = await readFile(phase4Url, "utf8");
  assert.match(sql, /constraint organization_preferences_completion[\s\S]*setup_status <> 'complete' or setup_completed_at is not null/i);
  assert.match(sql, /constraint folder_drafts_confirmation[\s\S]*status not in \('confirmed', 'applied'\) or confirmed_at is not null/i);
  assert.match(sql, /constraint drive_operations_completion[\s\S]*status <> 'completed' or completed_at is not null/i);
  assert.match(sql, /constraint document_actions_confirmed_due_date[\s\S]*not due_date_confirmed or due_date is not null/i);
  assert.match(sql, /constraint document_actions_completion[\s\S]*status not in \('completed', 'archived'\) or completed_at is not null/i);
});

test("root changes retire the old system-folder mapping atomically and remain server-only", async () => {
  const sql = await readFile(phase4Url, "utf8");
  assert.match(sql, /function public\.change_drive_root[\s\S]*for update[\s\S]*pending_folder_id = null[\s\S]*special_type = null,[\s\S]*is_active = false/i);
  assert.match(sql, /revoke execute on function public\.change_drive_root\(uuid, uuid, text, text\) from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.change_drive_root\(uuid, uuid, text, text\) to service_role/i);
});

test("future tables and audit events are unavailable to client roles", async () => {
  const sql = await readFile(initialUrl, "utf8");
  for (const table of futureTables) {
    assert.match(sql, new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated`, "i"));
    assert.match(sql, new RegExp(`grant all on table public\\.${table} to service_role`, "i"));
  }
  assert.match(sql, /revoke all on sequence public\.audit_events_id_seq from public, anon, authenticated/i);
  assert.match(sql, /grant all on sequence public\.audit_events_id_seq to service_role/i);
  assert.doesNotMatch(sql, /create policy\s+\S+\s+on public\.(?:audit_events|connected_accounts|organizational_entities|destination_folders|organization_rules|processing_jobs|document_metadata|subscriptions)/i);
});

test("tenant-owned relationships enforce the same user_id", async () => {
  const sql = await readFile(initialUrl, "utf8");
  for (const constraint of [
    "folders_account_owner_fk",
    "folders_entity_owner_fk",
    "rules_folder_owner_fk",
    "documents_job_owner_fk",
    "documents_entity_owner_fk",
    "documents_folder_owner_fk",
  ]) {
    assert.match(sql, new RegExp(`constraint ${constraint} foreign key \\([^)]*, user_id\\)[\\s\\S]*?references public\\.`, "i"));
  }
});

test("security-definer auth triggers are narrow and not client-executable", async () => {
  const [initial, phase3] = await Promise.all([readFile(initialUrl, "utf8"), readFile(phase3Url, "utf8")]);
  assert.match(initial, /function public\.handle_new_user\(\)[\s\S]*security definer set search_path = ''/i);
  assert.match(phase3, /function public\.sync_profile_email\(\)[\s\S]*security definer set search_path = ''/i);
  assert.match(phase3, /revoke execute on function public\.handle_new_user\(\) from public, anon, authenticated/i);
  assert.match(phase3, /revoke execute on function public\.sync_profile_email\(\) from public, anon, authenticated/i);
});

test("profile creation and least-privilege Phase 3 access remain intact", async () => {
  const [initial, phase3] = await Promise.all([readFile(initialUrl, "utf8"), readFile(phase3Url, "utf8")]);
  assert.match(initial, /create trigger on_auth_user_created after insert on auth\.users[\s\S]*public\.handle_new_user\(\)/i);
  assert.match(phase3, /insert into public\.profiles \(user_id, email, display_name, locale\)/i);
  assert.match(phase3, /profiles_owner_select[\s\S]*for select to authenticated/i);
  assert.match(phase3, /profiles_owner_update[\s\S]*for update to authenticated/i);
  assert.match(phase3, /grant update \(display_name, locale\) on public\.profiles to authenticated/i);
  assert.doesNotMatch(`${initial}\n${phase3}`, /\b(?:drop table|truncate table|delete from)\b/i);
});
