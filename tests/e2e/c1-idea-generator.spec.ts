import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { admin, cleanup, magicLink, sharedUser } from "./helpers";

const live = !!process.env.PLAYWRIGHT_BASE_URL;

async function user(page: Page, withProfile = true) {
  const u = await sharedUser(page);
  if (withProfile) await admin.from("profiles").update({ goal: "get_leads", niche: "Consultant or coach" }).eq("id", u.id);
  const ws = (await admin.from("workspaces").select("id").eq("owner_id", u.id).single()).data!.id as string;
  await page.goto("/app/ideas");
  return { ...u, ws };
}
const list = (page: Page) => page.getByRole("list", { name: "Post ideas" }).getByRole("listitem");
const texts = async (page: Page) => (await list(page).locator("p").allInnerTexts()).map((t) => t.replace(/^Idea \d+:\s*/, "").trim());
const click = (page: Page) => page.getByRole("button", { name: /^Get 20 ideas$/ }).click();

test.describe("stubbed model", () => {
  test.skip(live, "needs the stubbed model");

  test("one click shows exactly 20 plain ideas and stores them", async ({ page }) => {
    const u = await user(page);
    try {
      await click(page);
      await expect(list(page)).toHaveCount(20);
      const t = await texts(page);
      expect(t.every((x) => x.length > 0 && x.length <= 120)).toBe(true);
      expect(new Set(t).size).toBe(20);
      const stored = (await admin.from("ideas").select("text").eq("workspace_id", u.ws)).data!;
      expect(stored).toHaveLength(20);
    } finally {
      await cleanup(u.id);
    }
  });

  test("a second click never repeats ideas from the first, even if the model does", async ({ page }) => {
    const u = await user(page);
    try {
      await click(page);
      await expect(list(page)).toHaveCount(20);
      const first = await texts(page);

      await page.getByLabel("Focus on (optional)").fill("AI_STUB_DUPES");
      await click(page);
      await expect.poll(async () => (await texts(page)).some((x) => !first.includes(x))).toBe(true);
      await expect(list(page)).toHaveCount(20);
      const second = await texts(page);
      expect(second.filter((x) => first.includes(x))).toEqual([]);
    } finally {
      await cleanup(u.id);
    }
  });

  test("a banned phrase never shows, and the list is still 20", async ({ page }) => {
    const u = await user(page);
    try {
      await page.getByLabel("Focus on (optional)").fill("AI_STUB_BANNED");
      await click(page);
      await expect(list(page)).toHaveCount(20);
      expect((await texts(page)).some((x) => /game-changer/i.test(x))).toBe(false);
    } finally {
      await cleanup(u.id);
    }
  });

  test("when 20 cannot be reached it shows what it has and says so", async ({ page }) => {
    const u = await user(page);
    try {
      await page.getByLabel("Focus on (optional)").fill("AI_STUB_FEW");
      await click(page);
      await expect(page.getByText(/We could only find \d+ fresh ideas this time/)).toBeVisible();
      const n = await list(page).count();
      expect(n).toBeGreaterThan(0);
      expect(n).toBeLessThan(20);
    } finally {
      await cleanup(u.id);
    }
  });

  test("a failure shows the message and keeps the earlier list", async ({ page }) => {
    const u = await user(page);
    try {
      await click(page);
      await expect(list(page)).toHaveCount(20);
      const before = await texts(page);
      await page.getByLabel("Focus on (optional)").fill("AI_STUB_FAIL");
      await click(page);
      await expect(page.getByText("We couldn't get ideas. Try again.")).toBeVisible();
      expect(await texts(page)).toEqual(before);
    } finally {
      await cleanup(u.id);
    }
  });

  test("Write this post opens the writer with the idea as the topic", async ({ page }) => {
    const u = await user(page);
    try {
      await click(page);
      await expect(list(page)).toHaveCount(20);
      const idea = (await texts(page))[2];
      await list(page).nth(2).getByRole("link", { name: "Write this post" }).click();
      await expect(page).toHaveURL(/\/app\/write\?topic=/);
      await expect(page.getByLabel("Topic or notes")).toHaveValue(idea);
    } finally {
      await cleanup(u.id);
    }
  });

  test("ideas are limited per day", async ({ page }) => {
    const u = await user(page);
    try {
      await admin.from("ai_usage").insert(Array.from({ length: 60 }, () => ({ workspace_id: u.ws, user_id: u.id, feature: "idea_generation", model: "test" })));
      await click(page);
      await expect(page.getByText("You've reached today's ideas limit. Try again tomorrow.")).toBeVisible();
    } finally {
      await cleanup(u.id);
    }
  });

  test("the ideas page fits a 390 px phone with 20 ideas showing", async ({ page }) => {
    const u = await user(page);
    try {
      await page.setViewportSize({ width: 390, height: 800 });
      await click(page);
      await expect(list(page)).toHaveCount(20);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    } finally {
      await cleanup(u.id);
    }
  });
});

test("without a goal and niche it asks for them and links to settings", async ({ page }) => {
  const u = await user(page, false);
  try {
    await click(page);
    await expect(page.getByText("Tell us your goal and niche first.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Open settings" })).toBeVisible();
  } finally {
    await cleanup(u.id);
  }
});

test("another user cannot read these ideas (RLS)", async ({ page }) => {
  test.skip(live, "needs the stubbed model");
  const u = await user(page);
  const emailB = `c1-rls-${Date.now()}@example.com`;
  const idB = (await admin.auth.admin.createUser({ email: emailB, email_confirm: true })).data.user!.id;
  try {
    await click(page);
    await expect(list(page)).toHaveCount(20);
    const b = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    await b.auth.verifyOtp({ type: "email", token_hash: (await magicLink(emailB)).tokenHash });
    expect((await b.from("ideas").select("id").eq("workspace_id", u.ws)).data).toEqual([]);
    const write = await b.from("ideas").insert({ workspace_id: u.ws, text: "intruder" });
    expect(write.error).not.toBeNull();
  } finally {
    await cleanup(u.id);
    await cleanup(idB);
  }
});

test.describe("real model (live site only)", () => {
  test.skip(!live, "calls the real model");

  test("5 clicks in a row: 20 ideas each, no repeats across lists, under 10 seconds, logged", async ({ page }) => {
    test.setTimeout(180_000);
    const u = await user(page);
    try {
      const all: string[] = [];
      const banned = ["game-changer", "unlock", "delve", "synergy", "leverage"];
      for (let i = 0; i < 5; i++) {
        const t0 = Date.now();
        await click(page);
        await expect.poll(async () => (await texts(page)).some((x) => !all.includes(x)), { timeout: 30_000 }).toBe(true);
        await expect(list(page)).toHaveCount(20);
        const seconds = (Date.now() - t0) / 1000;
        expect(seconds, `click ${i + 1} took ${seconds}s`).toBeLessThan(10);
        const t = await texts(page);
        expect(t.filter((x) => all.includes(x)), `click ${i + 1} repeated ideas`).toEqual([]);
        for (const x of t) {
          expect(x.length, x).toBeLessThanOrEqual(120);
          for (const b of banned) expect(x.toLowerCase(), x).not.toContain(b);
        }
        all.push(...t);
      }
      expect(new Set(all.map((x) => x.toLowerCase())).size).toBe(100);
      const rows = (await admin.from("ai_usage").select("model, tokens_in, cost_usd").eq("user_id", u.id).eq("feature", "idea_generation")).data!;
      expect(rows.length).toBeGreaterThanOrEqual(5);
      expect(rows.every((r) => r.model === "claude-haiku-5-5" && r.tokens_in > 0 && Number(r.cost_usd) > 0)).toBe(true);
    } finally {
      await cleanup(u.id);
    }
  });
});
