import { test, expect, type Page } from "@playwright/test";
import { admin, cleanup, sharedUser } from "./helpers";
import { encryptToken } from "../../src/lib/token-crypto";

const TOKEN = "AQV-E2E-TOKEN-0123456789-zzzzzz";
const SUPABASE_CALLBACK = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`;

// Clicks a button that starts LinkedIn sign-in and captures the LinkedIn address without loading LinkedIn.
async function captureLinkedIn(page: Page, click: () => Promise<void>) {
  await page.route(/linkedin\.com/, (r) => r.abort());
  const req = page.waitForRequest((r) => /linkedin\.com\/oauth\/v2\/authorization/.test(r.url()), { timeout: 20_000 });
  await click();
  return new URL((await req).url());
}

test("sign-in page: the LinkedIn button goes to LinkedIn with the minimal permissions and a state value", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByText("We read your name, photo and email. We never post for you.")).toBeVisible();
  const url = await captureLinkedIn(page, () => page.getByRole("button", { name: "Continue with LinkedIn" }).click());
  const p = url.searchParams;
  expect(p.get("response_type")).toBe("code");
  expect(p.get("client_id")).toMatch(/^[a-z0-9]{10,}$/i);
  expect(p.get("redirect_uri")).toBe(SUPABASE_CALLBACK);
  expect(p.get("state")?.length).toBeGreaterThan(10);
  expect(new Set((p.get("scope") ?? "").split(/[ +]/))).toEqual(new Set(["openid", "profile", "email"]));
});

test("the order is LinkedIn first, then the email form, and the one Marigold action is still the email button", async ({ page }) => {
  await page.goto("/sign-in");
  const li = page.getByRole("button", { name: "Continue with LinkedIn" });
  const email = page.getByRole("button", { name: "Email me a sign-in link" });
  expect((await li.boundingBox())!.y).toBeLessThan((await email.boundingBox())!.y);
  expect(await email.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe("rgb(242, 169, 0)");
  expect(await li.evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe("rgb(242, 169, 0)");
});

for (const [query, text] of [
  ["error=access_denied&error_description=user_cancelled_login", "You cancelled the LinkedIn sign-in. Try again, or use your email."],
  ["error=server_error&error_description=boom", "LinkedIn sign-in didn't work. Try again, or use your email."],
  ["error=server_error&error_description=Error+getting+user+email+from+external+provider", "LinkedIn didn't share your email. Use the email link, then connect LinkedIn in Settings."],
  ["error=server_error&error_code=identity_already_exists", "This LinkedIn account is already connected to another Qiva Reach account."],
] as const) {
  test(`a LinkedIn return with "${query.slice(0, 40)}" shows the right message`, async ({ page }) => {
    await page.goto(`/auth/callback?${query}`);
    await expect(page).toHaveURL(/\/sign-in\?error=linkedin_/);
    await expect(page.locator("#email-error")).toHaveText(text);
  });
}

test("the sign-in page fits a 390 px phone with the LinkedIn button", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/sign-in");
  await expect(page.getByRole("button", { name: "Continue with LinkedIn" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test("settings: an email user can start connecting LinkedIn and is sent back to Settings afterwards", async ({ page }) => {
  const u = await sharedUser(page);
  try {
    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: "LinkedIn" })).toBeVisible();
    const url = await captureLinkedIn(page, () => page.getByRole("button", { name: "Connect LinkedIn" }).click());
    expect(url.searchParams.get("redirect_uri")).toBe(SUPABASE_CALLBACK);
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === "qr_next")?.value).toBe("/app/settings");
  } finally {
    await cleanup(u.id);
  }
});

test("settings: a connected user sees name and date, the token never reaches the browser, and the stored token is encrypted", async ({ page }) => {
  const u = await sharedUser(page);
  try {
    const ws = (await admin.from("workspaces").select("id").eq("owner_id", u.id).single()).data!.id as string;
    await admin.from("linkedin_profiles").insert({
      workspace_id: ws, user_id: u.id, linkedin_sub: `e2e-${Date.now()}`, name: "Asha Rao", picture_url: "https://example.invalid/none.jpg",
      access_token_enc: encryptToken(TOKEN, process.env.TOKEN_ENCRYPTION_KEY!), token_expires_at: new Date(Date.now() + 60 * 864e5).toISOString(),
    });
    await admin.from("profiles").update({ full_name: "Asha Rao", avatar_url: "https://example.invalid/none.jpg" }).eq("id", u.id);

    const bodies: string[] = [];
    page.on("response", async (r) => {
      if (r.url().includes(new URL(page.url() || "http://x").host) || r.url().includes("supabase.co")) {
        const t = await r.text().catch(() => "");
        bodies.push(t);
      }
    });
    await page.goto("/app/settings");
    await expect(page.getByText("Asha Rao")).toBeVisible();
    await expect(page.getByText(/Connected on \d{1,2} \w{3} \d{4}/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Connect LinkedIn" })).toHaveCount(0);
    await page.goto("/app");
    await expect(page.getByRole("heading", { name: "Welcome, Asha Rao" })).toBeVisible();
    await page.waitForLoadState("networkidle");

    const html = await page.content();
    for (const text of [...bodies, html, await page.evaluate(() => document.documentElement.outerHTML)]) {
      expect(text).not.toContain(TOKEN);
      expect(text).not.toContain("access_token_enc");
    }
    const stored = (await admin.from("linkedin_profiles").select("access_token_enc").eq("user_id", u.id).single()).data!.access_token_enc as string;
    expect(stored.startsWith("v1:")).toBe(true);
    expect(stored).not.toContain(TOKEN);
  } finally {
    await admin.from("linkedin_profiles").delete().eq("user_id", u.id);
    await cleanup(u.id);
  }
});

test("settings shows the message when a connection was refused", async ({ page }) => {
  const u = await sharedUser(page);
  try {
    await page.goto("/app/settings?linkedin=already");
    await expect(page.getByRole("alert").filter({ hasText: "already connected to another" })).toBeVisible();
  } finally {
    await cleanup(u.id);
  }
});

test("settings fits a 390 px phone with the LinkedIn section", async ({ page }) => {
  const u = await sharedUser(page);
  try {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: "LinkedIn" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  } finally {
    await cleanup(u.id);
  }
});
