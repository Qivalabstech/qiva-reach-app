import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { zipSync, strToU8 } from "fflate";
import { admin, magicLink, userIdFor } from "./helpers";

const post = (n: number) => `Post ${n}: what I learned shipping a small product every single week.`;
const paste = (n: number) => Array.from({ length: n }, (_, i) => post(i + 1)).join("\n---\n");

async function newUser(page: Page, tag: string) {
  const email = `a4-${tag}-${Date.now()}@example.com`;
  await page.goto((await magicLink(email)).path);
  await expect(page).toHaveURL(/\/onboarding$/);
  const id = await userIdFor(email);
  await page.goto("/onboarding/voice");
  return { email, id };
}

const importedCount = async (id: string) =>
  (await admin.from("posts").select("*", { count: "exact", head: true }).eq("author_id", id).eq("status", "imported")).count;

test("fewer than 3 posts shows the clear message and cannot continue", async ({ page }) => {
  const u = await newUser(page, "few");
  try {
    await page.getByLabel(/Paste your past posts/).fill(paste(2));
    await expect(page.getByText("2 posts found")).toBeVisible();
    await expect(page.getByText("We need at least 3 posts to learn your voice. Paste a few more.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Learn my voice" })).toBeDisabled();
  } finally {
    await admin.auth.admin.deleteUser(u.id);
  }
});

test("5 pasted posts import, finish onboarding, and re-importing skips duplicates", async ({ page }) => {
  const u = await newUser(page, "paste");
  try {
    await page.getByLabel(/Paste your past posts/).fill(paste(5));
    await expect(page.getByText("5 posts found")).toBeVisible();
    await page.getByRole("button", { name: "Learn my voice" }).click();
    await expect(page).toHaveURL(/\/app\/voice$/);
    await expect(page.getByRole("heading", { name: "Your voice" })).toBeVisible();
    expect(await importedCount(u.id)).toBe(5);
    const p = (await admin.from("profiles").select("onboarded_at").eq("id", u.id).single()).data;
    expect(p?.onboarded_at).not.toBeNull();

    await page.goto("/onboarding/voice");
    await page.getByLabel(/Paste your past posts/).fill(paste(7));
    await page.getByRole("button", { name: "Learn my voice" }).click();
    await expect(page).toHaveURL(/\/app\/voice$/);
    expect(await importedCount(u.id)).toBe(7);
  } finally {
    await admin.auth.admin.deleteUser(u.id);
  }
});

test("Shares.csv and its zip both import", async ({ page }) => {
  const u = await newUser(page, "file");
  const rows = Array.from({ length: 6 }, (_, i) => `2024-0${i + 1}-01 10:00:00,l${i},"${post(i + 1)}\nA second line, with a comma.",,,MEMBER_NETWORK`);
  const csv = ["Date,ShareLink,ShareCommentary,SharedUrl,MediaUrl,Visibility", ...rows].join("\n");
  try {
    await page.getByRole("tab", { name: "Upload LinkedIn export" }).click();
    await page.getByLabel(/Upload Shares.csv/).setInputFiles({ name: "export.zip", mimeType: "application/zip", buffer: Buffer.from(zipSync({ "Shares.csv": strToU8(csv) })) });
    await expect(page.getByText("6 posts found")).toBeVisible();
    await page.getByLabel(/Upload Shares.csv/).setInputFiles({ name: "Shares.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
    await expect(page.getByText("6 posts found")).toBeVisible();
    await page.getByRole("button", { name: "Learn my voice" }).click();
    await expect(page).toHaveURL(/\/app\/voice$/);
    expect(await importedCount(u.id)).toBe(6);
    const body = (await admin.from("posts").select("body").eq("author_id", u.id).like("body", "Post 3:%").single()).data?.body;
    expect(body).toContain("A second line, with a comma.");
  } finally {
    await admin.auth.admin.deleteUser(u.id);
  }
});

test("a file with no posts shows a clear error", async ({ page }) => {
  const u = await newUser(page, "bad");
  try {
    await page.getByRole("tab", { name: "Upload LinkedIn export" }).click();
    await page.getByLabel(/Upload Shares.csv/).setInputFiles({ name: "Shares.csv", mimeType: "text/csv", buffer: Buffer.from("a,b\n1,2") });
    await expect(page.getByText("We couldn't find posts in that file")).toBeVisible();
  } finally {
    await admin.auth.admin.deleteUser(u.id);
  }
});

test("imported posts are invisible to other users (RLS)", async ({ page }) => {
  const a = await newUser(page, "rls-a");
  const emailB = `a4-rls-b-${Date.now()}@example.com`;
  await admin.auth.admin.createUser({ email: emailB, email_confirm: true });
  const idB = await userIdFor(emailB);
  try {
    await page.getByLabel(/Paste your past posts/).fill(paste(4));
    await page.getByRole("button", { name: "Learn my voice" }).click();
    await expect(page).toHaveURL(/\/app\/voice$/);

    const b = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    await b.auth.verifyOtp({ type: "email", token_hash: (await magicLink(emailB)).tokenHash });
    expect((await b.from("posts").select("id")).data).toEqual([]);
    const ws = (await admin.from("workspaces").select("id").eq("owner_id", a.id).single()).data!;
    const write = await b.from("posts").insert({ workspace_id: ws.id, author_id: idB, body: post(99), status: "imported" });
    expect(write.error).not.toBeNull();
  } finally {
    await admin.auth.admin.deleteUser(a.id);
    await admin.auth.admin.deleteUser(idB);
  }
});

test("skipping goes to the app with the empty state; page fits 390 px", async ({ page }) => {
  const u = await newUser(page, "skip");
  try {
    await page.setViewportSize({ width: 390, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.getByRole("button", { name: "I'll do this later" }).click();
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByText("No drafts yet. Paste a few old posts")).toBeVisible();
    expect(await importedCount(u.id)).toBe(0);
  } finally {
    await admin.auth.admin.deleteUser(u.id);
  }
});
