import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptToken, encryptToken } from "../src/lib/token-crypto";

const key = () => randomBytes(32).toString("base64");
const TOKEN = "AQV-test-token-0123456789-abcdefghij";

describe("token crypto", () => {
  it("round trips", () => {
    const k = key();
    expect(decryptToken(encryptToken(TOKEN, k), k)).toBe(TOKEN);
  });
  it("round trips long and unicode tokens", () => {
    const k = key();
    const t = "x".repeat(1500) + "नमस्ते";
    expect(decryptToken(encryptToken(t, k), k)).toBe(t);
  });
  it("stores a versioned string that never contains the token", () => {
    const stored = encryptToken(TOKEN, key());
    expect(stored.startsWith("v1:")).toBe(true);
    expect(stored.split(":")).toHaveLength(4);
    expect(stored).not.toContain(TOKEN);
    expect(Buffer.from(stored.split(":")[3], "base64").toString("utf8")).not.toContain("AQV");
  });
  it("two encryptions of the same text differ", () => {
    const k = key();
    expect(encryptToken(TOKEN, k)).not.toBe(encryptToken(TOKEN, k));
  });
  it("a different key fails", () => {
    expect(() => decryptToken(encryptToken(TOKEN, key()), key())).toThrow();
  });
  it("a changed byte fails (tamper check)", () => {
    const k = key();
    const [v, iv, tag, ct] = encryptToken(TOKEN, k).split(":");
    const bytes = Buffer.from(ct, "base64");
    bytes[0] ^= 1;
    expect(() => decryptToken([v, iv, tag, bytes.toString("base64")].join(":"), k)).toThrow();
    const t = Buffer.from(tag, "base64");
    t[0] ^= 1;
    expect(() => decryptToken([v, iv, t.toString("base64"), ct].join(":"), k)).toThrow();
  });
  it("rejects an unknown version or a malformed value", () => {
    const k = key();
    expect(() => decryptToken(encryptToken(TOKEN, k).replace("v1:", "v2:"), k)).toThrow("Unknown token format");
    expect(() => decryptToken("garbage", k)).toThrow();
  });
  it("rejects a key that is not 32 bytes", () => {
    expect(() => encryptToken(TOKEN, Buffer.from("short").toString("base64"))).toThrow("32 bytes");
  });
});
