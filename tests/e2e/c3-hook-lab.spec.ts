import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { admin, cleanup, magicLink, sharedUser, userIdFor } from "./helpers";

const live = !!process.env.PLAYWRIGHT_BASE_URL;
const BODY = "Our onboarding story\n\nWe cut onboarding from 9 days to 3 days.\n\nThe trick was one clear checklist, sent on day one.\n\nNothing fancy. Just fewer surprises.";
const POSTS = [
  BODY,
  "I stopped taking sales calls without an agenda.\n\nBefore, calls drifted. Both sides left unsure what was decided.\n\nNow I send a short note first: what we will cover, what we need to decide, how long we have.\n\nCalls got shorter. Buyers came in ready.\n\nIf your calendar is full of calls that go nowhere, fix the front door.",
  "Hired our first support person this month.\n\nThe lesson: write the playbook before the hire, not after.\n\nWe wrote ten pages of answers to the questions customers ask most. Day one, she was useful.\n\nClarity is kindness. Write it down.",
];

async function userWithDraft(page: Page, tag: string, body = BODY) {
  void tag;
  const { email, id } = await sharedUser(page);
  const ws = (await admin.from("workspaces").select("id").eq("owner_id", id).single()).data!.id as string;
  const post = (await admin.from("posts").insert({ workspace_id: ws, author_id: id, body, status: "draft", notes: "n" }).select("id").single()).data!;
  await page.goto(`/app/write/${post.id}`);
  return { email, id, ws, postId: post.id as string };
}
const dbBody = async (postId: string) => (await admin.from("posts").select("body, hook").eq("id", postId).single()).data!;
const options = (page: Page) => page.getByRole("listitem", { name: /^Hook \d+ of \d+, score \d+ out of 10$/ });
const restOf = (b: string) => b.slice(b.indexOf("\n"));

test.describe("stubbed model", () => {
  test.skip(live, "needs the stubbed model");

  test("shows the current line plus exactly 10 scored options, best first", async ({ page }) => {
    const u = await userWithDraft(page, "list");
    try {
      await page.getByRole("button", { name: "Improve the hook" }).click();
      await expect(options(page)).toHaveCount(10);
      const scores = (await options(page).evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")!)))
        .map((l) => Number(l.match(/score (\d+) out of 10/)![1]));
      expect(scores.every((s) => Number.isInteger(s) && s >= 1 && s <= 10)).toBe(true);
      expect(scores).toEqual([...scores].sort((a, b) => b - a));
      expect(new Set(scores).size).toBeGreaterThanOrEqual(3);
      const current = page.getByRole("listitem", { name: "Your current first line" });
      await expect(current).toContainText("Our onboarding story");
      await expect(current).toContainText("In your post");
      await expect(page.getByText("They don't predict views.")).toBeVisible();
    } finally {
      await cleanup(u.id);
    }
  });

  test("one click swaps only the first line, and the old line can be swapped back exactly", async ({ page }) => {
    const u = await userWithDraft(page, "swap");
    try {
      await page.getByRole("button", { name: "Improve the hook" }).click();
      const first = options(page).first();
      const text = (await first.locator("p").nth(1).innerText()).trim();
      await first.getByRole("button", { name: "Use this hook" }).click();
      await expect(first.getByText("In your post")).toBeVisible();

      const box = page.getByLabel("Your post");
      const swapped = await box.inputValue();
      expect(swapped.split("\n")[0]).toBe(text);
      expect(restOf(swapped)).toBe(restOf(BODY));
      const row = await dbBody(u.postId);
      expect(row.body).toBe(swapped);
      expect(row.hook).toBe(text);

      const current = page.getByRole("listitem", { name: "Your current first line" });
      await current.getByRole("button", { name: "Use this hook" }).click();
      await expect(box).toHaveValue(BODY);
      expect((await dbBody(u.postId)).body).toBe(BODY);
      await expect(current.getByText("In your post")).toBeVisible();
    } finally {
      await cleanup(u.id);
    }
  });

  test("hooks that are too long, banned or invent numbers are replaced so 10 valid ones show", async ({ page }) => {
    const u = await userWithDraft(page, "bad", `${BODY}\n\nAI_STUB_BADHOOKS`);
    try {
      await page.getByRole("button", { name: "Improve the hook" }).click();
      await expect(options(page)).toHaveCount(10);
      await expect(page.getByText(/far too long/)).toHaveCount(0);
    } finally {
      await cleanup(u.id);
    }
  });

  test("a model failure shows the message and keeps the draft", async ({ page }) => {
    const u = await userWithDraft(page, "fail", `${BODY}\n\nAI_STUB_FAIL`);
    try {
      await page.getByRole("button", { name: "Improve the hook" }).click();
      await expect(page.getByText("We couldn't get hooks. Try again.")).toBeVisible();
      await expect(page.getByLabel("Your post")).toHaveValue(/Our onboarding story/);
    } finally {
      await cleanup(u.id);
    }
  });

  test("Show 10 more keeps the current-line row and 10 options; keyboard can swap", async ({ page }) => {
    const u = await userWithDraft(page, "more");
    try {
      await page.getByRole("button", { name: "Improve the hook" }).click();
      await expect(options(page)).toHaveCount(10);
      await page.getByRole("button", { name: "Show 10 more" }).click();
      await expect(options(page)).toHaveCount(10);
      await expect(page.getByRole("listitem", { name: "Your current first line" })).toBeVisible();

      const btn = options(page).nth(1).getByRole("button", { name: "Use this hook" });
      await expect(btn).toBeEnabled(); // buttons are disabled while a list is loading
      await btn.focus();
      await page.keyboard.press("Enter");
      await expect(options(page).nth(1).getByText("In your post")).toBeVisible();
    } finally {
      await cleanup(u.id);
    }
  });

  test("hook lists are limited per day", async ({ page }) => {
    const u = await userWithDraft(page, "limit");
    try {
      await admin.from("ai_usage").insert(Array.from({ length: 80 }, () => ({ workspace_id: u.ws, user_id: u.id, feature: "hook_lab", model: "test" })));
      await page.getByRole("button", { name: "Improve the hook" }).click();
      await expect(page.getByText("You've reached today's hook limit. Try again tomorrow.")).toBeVisible();
    } finally {
      await cleanup(u.id);
    }
  });

  test("the hook panel fits a 390 px phone", async ({ page }) => {
    const u = await userWithDraft(page, "mobile");
    try {
      await page.setViewportSize({ width: 390, height: 800 });
      await page.getByRole("button", { name: "Improve the hook" }).click();
      await expect(options(page)).toHaveCount(10);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    } finally {
      await cleanup(u.id);
    }
  });
});

test("another user cannot change this draft's hook (RLS)", async ({ page }) => {
  const a = await userWithDraft(page, "rls-a");
  const emailB = `c3-rls-b-${Date.now()}@example.com`;
  await admin.auth.admin.createUser({ email: emailB, email_confirm: true });
  const idB = await userIdFor(emailB);
  try {
    const b = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    await b.auth.verifyOtp({ type: "email", token_hash: (await magicLink(emailB)).tokenHash });
    const write = await b.from("posts").update({ body: "hacked", hook: "hacked" }).eq("id", a.postId).select("id");
    expect(write.data).toEqual([]);
    expect((await dbBody(a.postId)).body).toBe(BODY);
  } finally {
    await cleanup(a.id);
    await cleanup(idB);
  }
});

test.describe("real model (live site only)", () => {
  test.skip(!live, "calls the real model");

  test("3 real posts: 10 valid hooks each, varied scores, under 10 seconds, logged", async ({ page }) => {
    test.setTimeout(180_000);
    const u = await userWithDraft(page, "real", POSTS[0]);
    try {
      const banned = ["game-changer", "unlock", "delve", "synergy", "leverage"];
      for (const [i, body] of POSTS.entries()) {
        if (i > 0) {
          const p = (await admin.from("posts").insert({ workspace_id: u.ws, author_id: u.id, body, status: "draft", notes: "n" }).select("id").single()).data!;
          await page.goto(`/app/write/${p.id}`);
        }
        const t0 = Date.now();
        await page.getByRole("button", { name: "Improve the hook" }).click();
        await expect(options(page)).toHaveCount(10, { timeout: 30_000 });
        const seconds = (Date.now() - t0) / 1000;
        expect(seconds, `post ${i} took ${seconds}s`).toBeLessThan(10);

        const labels = await options(page).evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")!));
        const scores = labels.map((l) => Number(l.match(/score (\d+) out of 10/)![1]));
        expect(new Set(scores).size, `post ${i} scores ${scores}`).toBeGreaterThanOrEqual(3);
        const texts = await options(page).evaluateAll((els) => els.map((e) => e.querySelectorAll("p")[1].textContent!.trim()));
        const postDigits = new Set(body.match(/\d+(?:[.,]\d+)?/g) ?? []);
        for (const t of texts) {
          expect(t.length, t).toBeLessThanOrEqual(120);
          for (const b of banned) expect(t.toLowerCase(), t).not.toContain(b);
          for (const d of t.match(/\d+(?:[.,]\d+)?/g) ?? []) expect(postDigits.has(d), `${t} uses ${d}`).toBe(true);
        }
      }
      const rows = (await admin.from("ai_usage").select("model, tokens_in, cost_usd").eq("user_id", u.id).eq("feature", "hook_lab")).data!;
      expect(rows.length).toBeGreaterThanOrEqual(3);
      expect(rows.every((r) => r.model === "claude-haiku-5-5" && r.tokens_in > 0 && Number(r.cost_usd) > 0)).toBe(true);
    } finally {
      await cleanup(u.id);
    }
  });
});
