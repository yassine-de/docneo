import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Drive authorization is separate, least-privilege and protected by state", async () => {
  const [config, google, start, callback] = await Promise.all([read("src/features/drive/config.ts"), read("src/features/drive/google.ts"), read("src/app/[locale]/drive/connect/route.ts"), read("src/app/api/drive/callback/route.ts")]);
  assert.match(config, /auth\/drive\.file/);
  assert.doesNotMatch(config, /auth\/drive["']/);
  assert.match(google, /access_type: "offline"/);
  assert.match(google, /include_granted_scopes: "false"/);
  assert.match(start, /randomBytes\(32\)/);
  assert.match(start, /httpOnly: true/);
  assert.match(callback, /timingSafeEqual/);
  assert.match(callback, /Cache-Control", "private, no-store/);
  assert.doesNotMatch(callback, /console\.|access_token[^\n]*log|refresh_token[^\n]*log/);
});

test("folder confirmation derives root from the server and only creates the mandatory child", async () => {
  const route = await read("src/app/api/organization/confirm/route.ts");
  assert.match(route, /connection\.root_folder_id/);
  assert.doesNotMatch(route, /parsed\.data\.(?:root|rootFolder|folderId)/);
  assert.match(route, /findChildFolder/);
  assert.match(route, /PENDING_FOLDER_NAME/);
  assert.match(route, /validateFolderStructure/);
  assert.match(route, /idempotency_key/);
  assert.match(route, /invalid_origin/);
  assert.match(route, /parent_provider_folder_id: connection\.root_folder_id/);
  assert.match(route, /special_type: "pending_documents"/);
  assert.match(route, /pending\.parents\?\.includes\(connection\.root_folder_id\)/);
  assert.doesNotMatch(route, /files\.update|files\.delete|trash/);
});

test("tokens use AES-GCM and remain in server-only modules", async () => {
  const [cryptoWrapper, cryptoSource, clientSource] = await Promise.all([read("src/features/drive/crypto.ts"), read("src/features/drive/crypto-core.ts"), read("src/components/app/organization-onboarding.tsx")]);
  assert.match(cryptoWrapper, /import "server-only"/);
  assert.match(cryptoSource, /AES-GCM/);
  assert.match(cryptoSource, /Buffer\.from\(value, "hex"\)/);
  assert.match(cryptoSource, /Uint8Array\(12\)/);
  assert.doesNotMatch(clientSource, /access_token|refresh_token|TOKEN_ENCRYPTION_KEY|SERVICE_ROLE/);
});

test("invalid Drive authorization persists a safe reconnect state and exposes localized recovery UI", async () => {
  const [access, repository, route, drivePage, onboarding, copy] = await Promise.all([
    read("src/features/drive/access.ts"),
    read("src/features/drive/repository.ts"),
    read("src/app/api/organization/confirm/route.ts"),
    read("src/app/[locale]/(authenticated)/drive/page.tsx"),
    read("src/components/app/organization-onboarding.tsx"),
    read("src/features/organization/copy.ts"),
  ]);
  assert.match(access, /markReconnectRequired\(userId\)/);
  assert.match(repository, /status: "reconnect_required"/);
  assert.match(repository, /refresh_token_ciphertext: null/);
  assert.match(route, /drive_reconnect_required/);
  assert.match(drivePage, /reconnectRequired/);
  assert.match(onboarding, /drive\/connect\?mode=connect/);
  assert.match(copy, /Autorisierung ist abgelaufen/);
  assert.match(copy, /autorisation Google Drive a expiré/);
});
