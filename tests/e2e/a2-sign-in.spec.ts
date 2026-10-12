import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

// Generates a real magic link without sending an email.
async function magicLinkFor(email: string) {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw error;
  return `/auth/callback?token_hash=${data.properties.hashed_token}&type=email`;
}

test("invalid email shows a clear error", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill("not-an-email");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.locator("#email-error")).toContainText("doesn't look right");
});

test("signed-out visitors are sent to sign-in", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("sign-in page fits a 390 px phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/sign-in");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
});

test("magic link: new user -> onboarding, returning user -> app; one workspace + free plan", async ({ page }) => {
  const email = `a2-test-${Date.now()}@example.com`;
  let userId = "";
  try {
    await page.goto(await magicLinkFor(email));
    await expect(page).toHaveURL(/\/onboarding$/);

    const { data: users } = await admin.auth.admin.listUsers({ perPage: 200 });
    userId = users.users.find((u) => u.email === email)!.id;
    const count = async (table: string, col: string) =>
      (await admin.from(table).select("*", { count: "exact", head: true }).eq(col, userId)).count;
    expect(await count("workspace_members", "user_id")).toBe(1);
    expect(await count("workspaces", "owner_id")).toBe(1);
    const ws = (await admin.from("workspaces").select("id").eq("owner_id", userId).single()).data!;
    const subs = await admin.from("subscriptions").select("plan").eq("workspace_id", ws.id).single();
    expect(subs.data?.plan).toBe("free");

    await admin.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("id", userId);
    await page.context().clearCookies();
    await page.goto(await magicLinkFor(email));
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/sign-in$/);
  } finally {
    if (userId) await admin.auth.admin.deleteUser(userId);
  }
});

test("a used or bad link shows a clear message", async ({ page }) => {
  await page.goto("/auth/callback?token_hash=bogus&type=email");
  await expect(page).toHaveURL(/\/sign-in\?error=link/);
  await expect(page.locator("#email-error")).toContainText("expired");
});
