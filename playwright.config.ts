import { defineConfig } from "@playwright/test";

process.loadEnvFile(".env.local");
process.env.PW_RUN_ID ??= String(Date.now()); // names this run's test users so teardown can remove them

// Set PLAYWRIGHT_BASE_URL to run the same tests against a deployed site.
const live = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  timeout: 60_000, // every test signs up a fresh user, and the database is far from this machine
  expect: { timeout: live ? 15_000 : 5_000 },
  use: { baseURL: live ?? "http://localhost:3000" },
  // AI_STUB makes the local server answer model calls with a fixed reply (see src/ai/client.ts).
  webServer: live
    ? undefined
    : { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true, env: { AI_STUB: "1" } },
});
