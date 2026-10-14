import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL("../supabase/migrations/202610140002_phase3_auth_profiles.sql", import.meta.url);

test("profile migration enforces owner isolation and constrained updates", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /profiles_owner_select[\s\S]*auth\.uid\(\)[\s\S]*user_id/i);
  assert.match(sql, /profiles_owner_update[\s\S]*with check[\s\S]*auth\.uid\(\)[\s\S]*user_id/i);
  assert.match(sql, /revoke insert, delete on public\.profiles from authenticated/i);
  assert.match(sql, /revoke update on public\.profiles from authenticated/i);
  assert.match(sql, /grant select on public\.profiles to authenticated/i);
  assert.match(sql, /grant update \(display_name, locale\)/i);
  assert.doesNotMatch(sql, /service_role_key|postgresql:\/\//i);
});
