import type { Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

export const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

// Generates a real magic link without sending an email.
export async function magicLink(email: string) {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw error;
  return { tokenHash: data.properties.hashed_token, path: `/auth/callback?token_hash=${data.properties.hashed_token}&type=email` };
}

export async function userIdFor(email: string) {
  for (let page = 1; page <= 20; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const u = data.users.find((x) => x.email === email);
    if (u) return u.id;
    if (data.users.length < 200) break;
  }
  throw new Error(`no user ${email}`);
}

export const RUN_ID = process.env.PW_RUN_ID ?? "local";

// Supabase Auth limits token verifications to about 30 per 5 minutes per IP, so tests must not
// log in once each. Each test worker logs in once and reuses that session; the user's data is wiped before every test.
let shared: { id: string; email: string; cookies: Awaited<ReturnType<ReturnType<Page["context"]>["cookies"]>> } | null = null;

export async function resetUser(id: string) {
  const ws = (await admin.from("workspaces").select("id").eq("owner_id", id).single()).data?.id;
  await admin.from("linkedin_profiles").delete().eq("user_id", id);
  await admin.from("posts").delete().eq("author_id", id);
  await admin.from("ai_usage").delete().eq("user_id", id);
  if (ws) {
    await admin.from("ideas").delete().eq("workspace_id", ws);
    await admin.from("voice_profiles").update({
      tone: null, preset: null, avg_length: null, emoji_use: null, banned_phrases: [], signature_phrases: [], analyzed_at: null, tone_source: null,
    }).eq("workspace_id", ws);
  }
  await admin.from("profiles").update({ goal: null, niche: null, onboarded_at: null, full_name: null, avatar_url: null }).eq("id", id);
}

// A clean, signed-in user with a personal workspace. Leaves the page on /onboarding.
export async function sharedUser(page: Page) {
  if (!shared) {
    const email = `t-${RUN_ID}-${process.pid}@example.com`;
    await page.goto((await magicLink(email)).path);
    shared = { id: await userIdFor(email), email, cookies: await page.context().cookies() };
  } else {
    await page.context().addCookies(shared.cookies);
    await resetUser(shared.id);
  }
  await page.goto("/onboarding");
  return { email: shared.email, id: shared.id };
}

// A second, separate user for tests about what another person can see. Costs one login.
export async function freshUser(page: Page) {
  const email = `t-${RUN_ID}-fresh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  await page.goto((await magicLink(email)).path);
  return { email, id: await userIdFor(email) };
}

// Wipes the shared user's data, or deletes any other test user.
export async function cleanup(id: string) {
  if (shared?.id === id) await resetUser(id);
  else await admin.auth.admin.deleteUser(id);
}
