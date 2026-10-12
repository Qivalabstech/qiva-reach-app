import { defineConfig } from "@playwright/test";

process.loadEnvFile(".env.local");

// Set PLAYWRIGHT_BASE_URL to run the same tests against a deployed site.
const live = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: live ?? "http://localhost:3000" },
  webServer: live ? undefined : { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true },
});
