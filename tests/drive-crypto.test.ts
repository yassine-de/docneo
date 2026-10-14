import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { decryptTokenValue, encryptTokenValue, TOKEN_ENCRYPTION_KEY_PATTERN } from "../src/features/drive/crypto-core";

test("64-character hexadecimal keys decode to AES-256 keys and round-trip tokens", async () => {
  const key = randomBytes(32).toString("hex");
  assert.match(key, TOKEN_ENCRYPTION_KEY_PATTERN);
  assert.equal(Buffer.from(key, "hex").length, 32);
  const ciphertext = await encryptTokenValue("refresh-token-test-value", key);
  assert.notEqual(ciphertext, "refresh-token-test-value");
  assert.equal(await decryptTokenValue(ciphertext, key), "refresh-token-test-value");
});

test("AES-GCM uses fresh nonces and rejects ciphertext tampering", async () => {
  const key = randomBytes(32).toString("hex");
  const first = await encryptTokenValue("same-token", key);
  const second = await encryptTokenValue("same-token", key);
  assert.notEqual(first, second);
  const pieces = first.split(".");
  const encrypted = Buffer.from(pieces[2], "base64url");
  encrypted[0] ^= 1;
  await assert.rejects(() => decryptTokenValue(`${pieces[0]}.${pieces[1]}.${encrypted.toString("base64url")}`, key));
});

test("invalid encryption keys are rejected without normalization", async () => {
  for (const key of ["", "a".repeat(63), "a".repeat(65), "g".repeat(64), randomBytes(32).toString("base64url")]) {
    assert.equal(TOKEN_ENCRYPTION_KEY_PATTERN.test(key), false);
    await assert.rejects(() => encryptTokenValue("token", key), /64 hexadecimal characters/);
  }
});
