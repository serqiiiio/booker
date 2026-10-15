import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";
import { E2E_EMAIL_DIR } from "./e2e/emails";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

// E2E runs against the disposable test database and its own server on 3100,
// so it never touches dev data or a `pnpm dev` already running on 3000.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) throw new Error("TEST_DATABASE_URL is not set (see .env.example)");
process.env.DATABASE_URL = testDatabaseUrl;

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    locale: "es-BO",
    timezoneId: "America/La_Paz",
    trace: "on-first-retry",
  },
  projects: [
    {
      // Mobile-first (constitution I.1): the staff uses the panel on a phone.
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: `pnpm exec next dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: testDatabaseUrl,
      BETTER_AUTH_URL: baseURL,
      EMAIL_TRANSPORT: "file",
      EMAIL_DIR: E2E_EMAIL_DIR,
    },
  },
});
