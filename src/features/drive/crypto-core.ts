export const TOKEN_ENCRYPTION_KEY_PATTERN = /^[0-9a-fA-F]{64}$/;

const encoder = new TextEncoder();

async function decodeKey(value: string) {
  if (!TOKEN_ENCRYPTION_KEY_PATTERN.test(value)) throw new Error("TOKEN_ENCRYPTION_KEY must be exactly 64 hexadecimal characters");
  const bytes = Buffer.from(value, "hex");
  if (bytes.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes");
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptTokenValue(token: string, encodedKey: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await decodeKey(encodedKey);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(token)));
  return `v1.${Buffer.from(iv).toString("base64url")}.${Buffer.from(encrypted).toString("base64url")}`;
}

export async function decryptTokenValue(ciphertext: string, encodedKey: string) {
  const [version, ivValue, encryptedValue] = ciphertext.split(".");
  if (version !== "v1" || !ivValue || !encryptedValue) throw new Error("Invalid token ciphertext");
  const key = await decodeKey(encodedKey);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: Buffer.from(ivValue, "base64url") }, key, Buffer.from(encryptedValue, "base64url"));
  return new TextDecoder().decode(decrypted);
}
