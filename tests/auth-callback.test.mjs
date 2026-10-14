import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const callbackUrl = new URL("../src/app/[locale]/auth/callback/route.ts", import.meta.url);

test("auth callback attaches exchanged session cookies to its redirect response", async () => {
  const source = await readFile(callbackUrl, "utf8");

  assert.match(source, /createServerClient/);
  assert.match(source, /getAll:\s*\(\)\s*=>\s*request\.cookies\.getAll\(\)/);
  assert.match(source, /response\.cookies\.set\(name, value, options\)/);
  assert.match(source, /applyAuthState\.forEach\(\(apply\)\s*=>\s*apply\(response\)\)/);
  assert.match(source, /Cache-Control",\s*"private, no-store"/);
  assert.doesNotMatch(source, /from\s+"@\/lib\/supabase\/server"/);
});
