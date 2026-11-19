import { defineConfig, devices } from "@playwright/test";

const MOCK_PORT = 4010;
const APP_PORT = 3210;

/** E2E against the real Next server, with Anthropic mocked at the HTTP boundary (ADR 0003). */
export default defineConfig({
  testDir: "e2e",
  testMatch: "*.spec.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "pnpm exec tsx e2e/mock-anthropic.ts",
      url: `http://localhost:${MOCK_PORT}/health`,
      env: { MOCK_PORT: String(MOCK_PORT) },
      reuseExistingServer: false,
      stdout: "ignore",
    },
    {
      // CI runs `pnpm build` in an earlier step; locally we build first.
      command: process.env.CI
        ? `pnpm exec next start -p ${APP_PORT}`
        : `pnpm exec next build && pnpm exec next start -p ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}`,
      timeout: 240_000,
      reuseExistingServer: false,
      env: {
        ANTHROPIC_BASE_URL: `http://localhost:${MOCK_PORT}`,
        ANTHROPIC_API_KEY: "test-key-not-real",
        COACH_MODEL: "claude-opus-5-5",
      },
    },
  ],
});
