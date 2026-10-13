import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM. Stored as "v1:<iv>:<tag>:<ciphertext>" (base64). The version prefix allows key rotation later.
const VERSION = "v1";

function key(b64: string): Buffer {
  const k = Buffer.from(b64, "base64");
  if (k.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes, base64 encoded");
  return k;
}

export function encryptToken(plain: string, keyB64: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(keyB64), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [VERSION, iv.toString("base64"), cipher.getAuthTag().toString("base64"), ct.toString("base64")].join(":");
}

export function decryptToken(stored: string, keyB64: string): string {
  const [version, iv, tag, ct] = stored.split(":");
  if (version !== VERSION || !iv || !tag || !ct) throw new Error("Unknown token format");
  const decipher = createDecipheriv("aes-256-gcm", key(keyB64), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ct, "base64")), decipher.final()]).toString("utf8");
}
