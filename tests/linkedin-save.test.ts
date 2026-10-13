// Integration test against the real Supabase project: needs .env.local. Skipped when the keys are missing.
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

try { process.loadEnvFile(".env.local"); } catch { /* keys may come from the environment */ }
const have = !!(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.TOKEN_ENCRYPTION_KEY);

describe.skipIf(!have)("saveLinkedInConnection (real database)", () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const stamp = Date.now();
  const ids: Record<"a" | "b", string> = { a: "", b: "" };
  const emails = { a: `li-a-${stamp}@example.com`, b: `li-b-${stamp}@example.com` };
  const KEY = process.env.TOKEN_ENCRYPTION_KEY!;

  beforeAll(async () => {
    for (const k of ["a", "b"] as const) {
      const r = await admin.auth.admin.createUser({ email: emails[k], email_confirm: true });
      ids[k] = r.data.user!.id;
    }
  });
  afterAll(async () => {
    for (const id of Object.values(ids)) if (id) await admin.auth.admin.deleteUser(id);
  });

  const conn = (sub: string, token: string) => ({ sub, name: "Asha Rao", picture: "https://media.licdn.com/p.jpg", token });
  const rows = async (userId: string) => (await admin.from("linkedin_profiles").select("*").eq("user_id", userId)).data!;

  it("stores the profile and an encrypted token that decrypts back, expiring in about 60 days", async () => {
    const { saveLinkedInConnection } = await import("../src/lib/linkedin");
    const { decryptToken } = await import("../src/lib/token-crypto");
    expect(await saveLinkedInConnection({ admin, userId: ids.a, connection: conn(`sub-a-${stamp}`, "AQV-TOKEN-ONE"), keyB64: KEY })).toBe("ok");
    const [row] = await rows(ids.a);
    expect(row).toMatchObject({ name: "Asha Rao", picture_url: "https://media.licdn.com/p.jpg", linkedin_sub: `sub-a-${stamp}` });
    expect(row.access_token_enc.startsWith("v1:")).toBe(true);
    expect(row.access_token_enc).not.toContain("AQV-TOKEN-ONE");
    expect(decryptToken(row.access_token_enc, KEY)).toBe("AQV-TOKEN-ONE");
    expect(row.refresh_token_enc).toBeNull();
    const days = (new Date(row.token_expires_at).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(59.9);
    expect(days).toBeLessThan(60.1);
    const audit = (await admin.from("audit_log").select("action, detail").eq("actor_id", ids.a)).data!;
    expect(audit.map((a) => a.action)).toContain("linkedin_connected");
    expect(JSON.stringify(audit)).not.toContain("AQV-TOKEN");
  });

  it("signing in again updates the same row with the new token", async () => {
    const { saveLinkedInConnection } = await import("../src/lib/linkedin");
    const { decryptToken } = await import("../src/lib/token-crypto");
    await saveLinkedInConnection({ admin, userId: ids.a, connection: { ...conn(`sub-a-${stamp}`, "AQV-TOKEN-TWO"), name: "Asha R." }, keyB64: KEY });
    const r = await rows(ids.a);
    expect(r).toHaveLength(1);
    expect(r[0].name).toBe("Asha R.");
    expect(decryptToken(r[0].access_token_enc, KEY)).toBe("AQV-TOKEN-TWO");
  });

  it("refuses a LinkedIn account that already belongs to another user", async () => {
    const { saveLinkedInConnection } = await import("../src/lib/linkedin");
    expect(await saveLinkedInConnection({ admin, userId: ids.b, connection: conn(`sub-a-${stamp}`, "AQV-OTHER"), keyB64: KEY })).toBe("already_connected");
    expect(await rows(ids.b)).toHaveLength(0);
    expect((await rows(ids.a))[0].linkedin_sub).toBe(`sub-a-${stamp}`);
  });

  it("keeps one LinkedIn account per user when they switch", async () => {
    const { saveLinkedInConnection } = await import("../src/lib/linkedin");
    await saveLinkedInConnection({ admin, userId: ids.a, connection: conn(`sub-a2-${stamp}`, "AQV-NEW"), keyB64: KEY });
    const r = await rows(ids.a);
    expect(r).toHaveLength(1);
    expect(r[0].linkedin_sub).toBe(`sub-a2-${stamp}`);
  });

  it("returns failed, without saving anything, when the key is bad", async () => {
    const { saveLinkedInConnection } = await import("../src/lib/linkedin");
    expect(await saveLinkedInConnection({ admin, userId: ids.b, connection: conn(`sub-b-${stamp}`, "T"), keyB64: "nope" })).toBe("failed");
    expect(await rows(ids.b)).toHaveLength(0);
  });

  it("saves the headline the user typed in both places, and clears it", async () => {
    const { saveHeadline } = await import("../src/lib/linkedin");
    expect(await saveHeadline({ admin, userId: ids.a, headline: "Founder, Acme" })).toBe(true);
    expect((await rows(ids.a))[0].headline).toBe("Founder, Acme");
    expect((await admin.from("profiles").select("headline").eq("id", ids.a).single()).data!.headline).toBe("Founder, Acme");
    expect(await saveHeadline({ admin, userId: ids.a, headline: null })).toBe(true);
    expect((await rows(ids.a))[0].headline).toBeNull();
  });

  it("removing LinkedIn access deletes the row and token, records it, and leaves other users alone", async () => {
    const { saveLinkedInConnection, removeLinkedInConnection } = await import("../src/lib/linkedin");
    await saveLinkedInConnection({ admin, userId: ids.b, connection: conn(`sub-b-${stamp}`, "AQV-B"), keyB64: KEY });
    expect(await rows(ids.b)).toHaveLength(1);
    expect(await removeLinkedInConnection({ admin, userId: ids.b })).toBe(true);
    expect(await rows(ids.b)).toHaveLength(0);
    expect(await rows(ids.a)).toHaveLength(1);
    const audit = (await admin.from("audit_log").select("action").eq("actor_id", ids.b)).data!;
    expect(audit.map((x) => x.action)).toContain("linkedin_removed");
    expect(await removeLinkedInConnection({ admin, userId: ids.b })).toBe(true); // nothing to remove is fine
  });

  it("the browser role cannot read the token columns, cannot write, and cannot see another user's row", async () => {
    const asUser = async (email: string) => {
      const c = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
      const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
      const v = await c.auth.verifyOtp({ type: "email", token_hash: link.data.properties!.hashed_token });
      expect(v.error).toBeNull();
      return c;
    };
    const a = await asUser(emails.a);
    const tokenRead = await a.from("linkedin_profiles").select("access_token_enc");
    expect(tokenRead.error?.code).toBe("42501");
    expect((await a.from("linkedin_profiles").select("refresh_token_enc")).error?.code).toBe("42501");
    const own = await a.from("linkedin_profiles").select("name, picture_url, created_at");
    expect(own.error).toBeNull();
    expect(own.data).toHaveLength(1);
    expect((await a.from("linkedin_profiles").insert({ workspace_id: crypto.randomUUID(), user_id: ids.a, linkedin_sub: "x" })).error).not.toBeNull();
    expect((await a.from("linkedin_profiles").update({ name: "hacked" }).eq("user_id", ids.a).select()).error).not.toBeNull();
    expect((await a.from("audit_log").select("id")).data ?? []).toEqual([]);

    const b = await asUser(emails.b);
    expect((await b.from("linkedin_profiles").select("name")).data).toEqual([]);
  }, 30_000);
});
