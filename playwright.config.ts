import { defineConfig } from "@playwright/test";

process.loadEnvFile(".env.local");

// Set PLAYWRIGHT_BASE_URL to run the same tests against a deployed site.
const live = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  expect: { timeout: live ? 15_000 : 5_000 },
  use: { baseURL: live ?? "http://localhost:3000" },
  // AI_STUB makes the local server answer model calls with a fixed reply (see src/ai/client.ts).
  webServer: live
    ? undefined
    : { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true, env: { AI_STUB: "1" } },
});
