import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const migrationsDirectory = new URL("../supabase/migrations/", import.meta.url);
const initialUrl = new URL("202610140001_initial_schema.sql", migrationsDirectory);
const phase3Url = new URL("202610140002_phase3_auth_profiles.sql", migrationsDirectory);

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

test("database migrations have a deterministic Phase 1 then Phase 3 order", async () => {
  const migrations = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql")).sort();
  assert.deepEqual(migrations, [
    "202610140001_initial_schema.sql",
    "202610140002_phase3_auth_profiles.sql",
  ]);
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
