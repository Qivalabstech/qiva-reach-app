import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { admin, cleanup, magicLink, sharedUser, userIdFor } from "./helpers";

const live = !!process.env.PLAYWRIGHT_BASE_URL; // live runs call the real model, so exact text is not fixed
const post = (n: number) => `Post ${n}: what I learned shipping a small product every single week.`;
const paste = (n: number, extra = "") => Array.from({ length: n }, (_, i) => post(i + 1) + (i === 0 ? extra : "")).join("\n---\n");

async function userWithPosts(page: Page, tag: string, text = paste(5)) {
  void tag;
  const u = await sharedUser(page);
  await page.goto("/onboarding/voice");
  await page.getByLabel(/Paste your past posts/).fill(text);
  await page.getByRole("button", { name: "Learn my voice" }).click();
  await expect(page).toHaveURL(/\/app\/voice$/);
  return u;
}

const profile = async (id: string) =>
  (await admin.from("voice_profiles").select("*, workspaces!inner(owner_id)").eq("workspaces.owner_id", id).single()).data!;

test.describe("stubbed model", () => {
  test.skip(live, "needs the stubbed model");

  test("import lands on the voice profile, filled in", async ({ page }) => {
    const u = await userWithPosts(page, "fill");
    try {
      await expect(page.getByLabel("Tone", { exact: true })).toHaveValue("direct, warm, short sentences");
      await expect(page.getByLabel("Average length (words)")).toHaveValue("20");
      await expect(page.getByLabel("None")).toBeChecked();
      await expect(page.getByText("Here is the thing", { exact: true })).toBeVisible();
      await expect(page.getByText("game-changer", { exact: true })).toBeVisible();
      const p = await profile(u.id);
      expect(p.tone_source).toBe("ai");
      expect(p.analyzed_at).not.toBeNull();
      expect(p.banned_phrases).toContain("game-changer");
    } finally {
      await cleanup(u.id);
    }
  });

  test("every field can be edited and persists; learn again keeps banned phrases", async ({ page }) => {
    const u = await userWithPosts(page, "edit");
    try {
      await page.getByLabel("Tone", { exact: true }).fill("blunt and funny");
      await page.getByLabel("Average length (words)").fill("120");
      await page.getByLabel("Frequent").check();
      await page.getByLabel("Signature phrases").fill("Let's go");
      await page.getByLabel("Signature phrases").press("Enter");
      await page.getByRole("button", { name: "Remove Here is the thing" }).click();
      await page.getByLabel("Banned phrases").fill("circle back");
      await page.getByLabel("Banned phrases").press("Enter");
      await page.getByRole("button", { name: "Remove unlock" }).click();
      await page.getByRole("button", { name: "Save voice profile" }).click();
      await expect(page.getByText("Saved.")).toBeVisible();

      await page.reload();
      await expect(page.getByLabel("Tone", { exact: true })).toHaveValue("blunt and funny");
      await expect(page.getByLabel("Average length (words)")).toHaveValue("120");
      await expect(page.getByLabel("Frequent")).toBeChecked();
      await expect(page.getByText("Let's go", { exact: true })).toBeVisible();
      await expect(page.getByText("Here is the thing", { exact: true })).toHaveCount(0);
      await expect(page.getByText("circle back", { exact: true })).toBeVisible();
      await expect(page.getByText("unlock", { exact: true })).toHaveCount(0);
      expect((await profile(u.id)).tone_source).toBe("user");

      await page.getByRole("button", { name: "Learn again from my posts" }).click();
      await expect(page.getByText("Your banned phrases stay.")).toBeVisible();
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page.getByText("Your banned phrases stay.")).toHaveCount(0);
      await expect(page.getByLabel("Tone", { exact: true })).toHaveValue("blunt and funny");

      await page.getByRole("button", { name: "Learn again from my posts" }).click();
      await page.getByRole("button", { name: "Replace" }).click();
      await expect(page.getByLabel("Tone", { exact: true })).toHaveValue("direct, warm, short sentences");
      await expect(page.getByLabel("Frequent")).not.toBeChecked();
      await expect(page.getByText("circle back", { exact: true })).toBeVisible();
      await expect(page.getByText("unlock", { exact: true })).toHaveCount(0);
    } finally {
      await cleanup(u.id);
    }
  });

  test("if the model fails, length and emoji still fill and the tone message shows", async ({ page }) => {
    const u = await userWithPosts(page, "fail", paste(5, " AI_STUB_FAIL"));
    try {
      await expect(page.getByText("We couldn't read your tone. Write it yourself or try again.")).toBeVisible();
      await expect(page.getByLabel("Tone", { exact: true })).toHaveValue("");
      await expect(page.getByLabel("Average length (words)")).toHaveValue("20");
      await expect(page.getByLabel("None")).toBeChecked();
    } finally {
      await cleanup(u.id);
    }
  });

  test("learning again is limited to 5 a day", async ({ page }) => {
    const u = await userWithPosts(page, "limit");
    try {
      const p = await profile(u.id);
      await admin.from("ai_usage").insert(
        Array.from({ length: 5 }, () => ({ workspace_id: p.workspace_id, user_id: u.id, feature: "voice_analysis", model: "test" })),
      );
      await page.getByRole("button", { name: "Learn again from my posts" }).click();
      await page.getByRole("button", { name: "Replace" }).click();
      await expect(page.getByText("You've learned your voice 5 times today. Try again tomorrow.")).toBeVisible();
    } finally {
      await cleanup(u.id);
    }
  });
});

test("without imported posts the voice page shows the empty state", async ({ page }) => {
  const email = `b1-empty-${Date.now()}@example.com`;
  await page.goto((await magicLink(email)).path);
  const id = await userIdFor(email);
  try {
    await page.goto("/app/voice");
    await expect(page.getByText("No posts yet. Paste a few old posts and we'll learn your voice.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Add posts" })).toBeVisible();
  } finally {
    await cleanup(id);
  }
});

test("another user cannot read or change this voice profile (RLS)", async ({ page }) => {
  const a = await userWithPosts(page, "rls-a");
  const emailB = `b1-rls-b-${Date.now()}@example.com`;
  await admin.auth.admin.createUser({ email: emailB, email_confirm: true });
  const idB = await userIdFor(emailB);
  try {
    const pa = await profile(a.id);
    const b = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    await b.auth.verifyOtp({ type: "email", token_hash: (await magicLink(emailB)).tokenHash });
    const own = await b.from("voice_profiles").select("workspace_id");
    expect(own.data?.some((r) => r.workspace_id === pa.workspace_id)).toBe(false);
    const write = await b.from("voice_profiles").update({ tone: "hacked" }).eq("workspace_id", pa.workspace_id).select("workspace_id");
    expect(write.data).toEqual([]);
    expect((await profile(a.id)).tone).not.toBe("hacked");
  } finally {
    await cleanup(a.id);
    await cleanup(idB);
  }
});

test("voice page fits a 390 px phone", async ({ page }) => {
  const u = await userWithPosts(page, "mobile");
  try {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  } finally {
    await cleanup(u.id);
  }
});

test.describe("real model (live site only)", () => {
  test.skip(!live, "calls the real model");

  test("the real model reads a tone and the call is logged with tokens and cost", async ({ page }) => {
    const u = await userWithPosts(page, "real");
    try {
      const tone = await page.getByLabel("Tone", { exact: true }).inputValue();
      expect(tone.length).toBeGreaterThan(5);
      expect(tone).not.toBe("direct, warm, short sentences");
      const row = (await admin.from("ai_usage").select("*").eq("user_id", u.id).eq("feature", "voice_analysis")).data?.[0];
      expect(row?.model).toBe("claude-haiku-5-5");
      expect(row?.tokens_in).toBeGreaterThan(0);
      expect(Number(row?.cost_usd)).toBeGreaterThan(0);
    } finally {
      await cleanup(u.id);
    }
  });
});
