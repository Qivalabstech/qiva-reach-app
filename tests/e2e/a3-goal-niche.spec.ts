import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { admin, magicLink, userIdFor } from "./helpers";

async function newUser(page: import("@playwright/test").Page, tag: string) {
  const email = `a3-${tag}-${Date.now()}@example.com`;
  await page.goto((await magicLink(email)).path);
  await expect(page).toHaveURL(/\/onboarding$/);
  return { email, id: await userIdFor(email) };
}

test("cannot continue without both a goal and a niche", async ({ page }) => {
  const u = await newUser(page, "req");
  try {
    const cont = page.getByRole("button", { name: "Continue" });
    await expect(cont).toBeDisabled();
    await page.getByLabel("Get leads and clients").check();
    await expect(cont).toBeDisabled();
    await page.getByRole("button", { name: "Sales" }).click();
    await expect(cont).toBeEnabled();
  } finally {
    await admin.auth.admin.deleteUser(u.id);
  }
});

test("chip and free-text niche save, show after reload, and update in settings", async ({ page }) => {
  const u = await newUser(page, "save");
  try {
    await page.getByLabel("Grow my audience").check();
    await page.getByRole("button", { name: "SaaS founder" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/onboarding\/voice$/);
    let row = (await admin.from("profiles").select("goal, niche").eq("id", u.id).single()).data;
    expect(row).toEqual({ goal: "grow_audience", niche: "SaaS founder" });

    await page.goto("/onboarding");
    await expect(page.getByLabel("Grow my audience")).toBeChecked();
    await expect(page.getByRole("button", { name: "SaaS founder" })).toHaveAttribute("aria-pressed", "true");

    await page.goto("/app/settings");
    await page.getByLabel("Find a job").check();
    await page.getByLabel("Something else").fill("  sustainable packaging  ");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();
    row = (await admin.from("profiles").select("goal, niche").eq("id", u.id).single()).data;
    expect(row).toEqual({ goal: "find_a_job", niche: "sustainable packaging" });

    await page.reload();
    await expect(page.getByLabel("Something else")).toHaveValue("sustainable packaging");
  } finally {
    await admin.auth.admin.deleteUser(u.id);
  }
});

test("a user cannot read or change another user's goal or niche (RLS)", async ({ page }) => {
  const a = await newUser(page, "a");
  const emailB = `a3-b-${Date.now()}@example.com`;
  await admin.auth.admin.createUser({ email: emailB, email_confirm: true });
  const idB = await userIdFor(emailB);
  try {
    await admin.from("profiles").update({ goal: "get_leads", niche: "Finance" }).eq("id", a.id);
    const bClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { tokenHash } = await magicLink(emailB);
    const { error } = await bClient.auth.verifyOtp({ type: "email", token_hash: tokenHash });
    expect(error).toBeNull();

    const read = await bClient.from("profiles").select("id").eq("id", a.id);
    expect(read.data).toEqual([]);
    const write = await bClient.from("profiles").update({ niche: "hacked" }).eq("id", a.id).select("id");
    expect(write.data).toEqual([]);
    expect((await admin.from("profiles").select("niche").eq("id", a.id).single()).data?.niche).toBe("Finance");
  } finally {
    await admin.auth.admin.deleteUser(a.id);
    await admin.auth.admin.deleteUser(idB);
  }
});

test("onboarding fits a 390 px phone", async ({ page }) => {
  const u = await newUser(page, "mobile");
  try {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/onboarding");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  } finally {
    await admin.auth.admin.deleteUser(u.id);
  }
});
