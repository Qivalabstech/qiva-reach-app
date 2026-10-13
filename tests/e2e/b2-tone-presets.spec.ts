import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { admin, cleanup, magicLink, sharedUser, userIdFor } from "./helpers";

const live = !!process.env.PLAYWRIGHT_BASE_URL;
const ORDER = ["Professional", "Story-led", "Contrarian", "Hinglish-friendly", "Data-driven"];

async function newUser(page: Page, tag: string) {
  void tag;
  const u = await sharedUser(page);
  await admin.from("profiles").update({ niche: "SaaS founder" }).eq("id", u.id);
  return u;
}
const preset = async (id: string) =>
  (await admin.from("voice_profiles").select("preset, workspaces!inner(owner_id)").eq("workspaces.owner_id", id).single()).data?.preset;
const card = (page: Page, name: string) => page.getByRole("listitem").filter({ has: page.getByRole("heading", { name, exact: true }) });

test("the voice page offers five presets plus none, and the choice persists", async ({ page }) => {
  const u = await newUser(page, "pick");
  try {
    await page.goto("/app/voice");
    const empty = await page.getByText("No posts yet").isVisible();
    if (empty) {
      // No imported posts yet: the form is hidden, so seed a profile the way an import would.
      await admin.from("voice_profiles").update({ analyzed_at: new Date().toISOString(), avg_length: 100, emoji_use: "none" }).eq("workspace_id", (await admin.from("workspaces").select("id").eq("owner_id", u.id).single()).data!.id);
      await page.reload();
    }
    await expect(page.getByRole("radio", { name: /No preset, just my voice/ })).toBeChecked();
    for (const name of ORDER) await expect(page.getByRole("radio", { name: new RegExp(name) })).toBeVisible();
    await page.getByRole("radio", { name: /Story-led/ }).check();
    await page.getByRole("button", { name: "Save voice profile" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("radio", { name: /Story-led/ })).toBeChecked();
    expect(await preset(u.id)).toBe("story_led");

    await page.getByRole("radio", { name: /No preset, just my voice/ }).check();
    await page.getByRole("button", { name: "Save voice profile" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();
    expect(await preset(u.id)).toBeNull();
  } finally {
    await cleanup(u.id);
  }
});

test.describe("stubbed model", () => {
  test.skip(live, "needs the stubbed model");

  test("compare shows five samples in order, and Use this preset saves it", async ({ page }) => {
    const u = await newUser(page, "compare");
    try {
      await page.goto("/app/voice/presets");
      await expect(page.getByLabel("What is the post about?")).toHaveValue("A lesson from a recent SaaS founder project");
      await page.getByRole("button", { name: "Show all five" }).click();
      const headings = page.getByRole("listitem").getByRole("heading");
      await expect(headings).toHaveText(ORDER);
      await expect(card(page, "Story-led")).toContainText("Stub sample for story_led");
      await expect(card(page, "Data-driven")).toContainText("Stub sample for data_driven");

      await card(page, "Story-led").getByRole("button", { name: "Use this preset" }).click();
      await expect(page).toHaveURL(/\/app\/voice$/);
      expect(await preset(u.id)).toBe("story_led");
    } finally {
      await cleanup(u.id);
    }
  });

  test("a failed card retries without clearing the others", async ({ page }) => {
    const u = await newUser(page, "retry");
    try {
      await page.goto("/app/voice/presets");
      const topic = page.getByLabel("What is the post about?");
      await topic.fill("Hiring AI_STUB_FAIL_contrarian");
      await page.getByRole("button", { name: "Show all five" }).click();
      await expect(card(page, "Contrarian")).toContainText("This one didn't load. Try again.");
      await expect(card(page, "Professional")).toContainText("Stub sample for professional");
      await expect(card(page, "Data-driven")).toContainText("Stub sample for data_driven");

      await topic.fill("Hiring");
      await card(page, "Contrarian").getByRole("button", { name: "Try again" }).click();
      await expect(card(page, "Contrarian")).toContainText("Stub sample for contrarian");
      await expect(card(page, "Professional")).toContainText("Stub sample for professional");
    } finally {
      await cleanup(u.id);
    }
  });

  test("comparisons are limited to 10 a day", async ({ page }) => {
    const u = await newUser(page, "limit");
    try {
      const ws = (await admin.from("workspaces").select("id").eq("owner_id", u.id).single()).data!;
      await admin.from("ai_usage").insert(
        Array.from({ length: 50 }, () => ({ workspace_id: ws.id, user_id: u.id, feature: "preset_preview", model: "test" })),
      );
      await page.goto("/app/voice/presets");
      await page.getByRole("button", { name: "Show all five" }).click();
      await expect(page.getByText("You've compared presets 10 times today. Try again tomorrow.")).toBeVisible();
    } finally {
      await cleanup(u.id);
    }
  });

  test("the compare page fits a 390 px phone with results showing", async ({ page }) => {
    const u = await newUser(page, "mobile");
    try {
      await page.setViewportSize({ width: 390, height: 800 });
      await page.goto("/app/voice/presets");
      await page.getByRole("button", { name: "Show all five" }).click();
      await expect(card(page, "Data-driven")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    } finally {
      await cleanup(u.id);
    }
  });
});

test("an empty topic asks for one", async ({ page }) => {
  const u = await newUser(page, "empty");
  try {
    await page.goto("/app/voice/presets");
    await page.getByLabel("What is the post about?").fill("   ");
    await page.getByRole("button", { name: "Show all five" }).click();
    await expect(page.getByText("Add a topic first.")).toBeVisible();
  } finally {
    await cleanup(u.id);
  }
});

test("another user cannot change this preset (RLS)", async ({ page }) => {
  const a = await newUser(page, "rls-a");
  const emailB = `b2-rls-b-${Date.now()}@example.com`;
  await admin.auth.admin.createUser({ email: emailB, email_confirm: true });
  const idB = await userIdFor(emailB);
  try {
    const ws = (await admin.from("workspaces").select("id").eq("owner_id", a.id).single()).data!;
    const b = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    await b.auth.verifyOtp({ type: "email", token_hash: (await magicLink(emailB)).tokenHash });
    const write = await b.from("voice_profiles").update({ preset: "contrarian" }).eq("workspace_id", ws.id).select("workspace_id");
    expect(write.data).toEqual([]);
    expect(await preset(a.id)).toBeNull();
  } finally {
    await cleanup(a.id);
    await cleanup(idB);
  }
});

test.describe("real model (live site only)", () => {
  test.skip(!live, "calls the real model");

  test("five real samples appear, none uses a banned phrase, and the calls are logged", async ({ page }) => {
    const u = await newUser(page, "real");
    try {
      await page.goto("/app/voice/presets");
      await page.getByLabel("What is the post about?").fill("Why I stopped taking sales calls without an agenda");
      await page.getByLabel(/Facts or numbers/).fill("We tested it for 6 weeks. Win rate went from 18% to 27%.");
      await page.getByRole("button", { name: "Show all five" }).click();
      await expect(page.getByRole("listitem").getByRole("heading")).toHaveText(ORDER, { timeout: 30_000 });
      for (const name of ORDER) {
        const text = (await card(page, name).locator("p").first().innerText()).toLowerCase();
        expect(text.length, name).toBeGreaterThan(100);
        expect(text).not.toContain("game-changer");
        expect(text).not.toContain("didn't load");
      }
      const rows = (await admin.from("ai_usage").select("model, tokens_in, cost_usd").eq("user_id", u.id).eq("feature", "preset_preview")).data!;
      expect(rows.length).toBeGreaterThanOrEqual(5);
      expect(rows.every((r) => r.model === "claude-haiku-5-5" && r.tokens_in > 0 && Number(r.cost_usd) > 0)).toBe(true);
    } finally {
      await cleanup(u.id);
    }
  });
});
