import { defineConfig } from "@playwright/test"

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"
const webServerPort = new URL(baseURL).port || "3000"

export default defineConfig({
  testDir: "./apps/web/e2e",
  snapshotPathTemplate:
    "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `pnpm --dir apps/web exec next dev --port ${webServerPort}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PLAYWRIGHT_TEST: "1",
      ...(process.env.COWARDS_RUNTIME_SERVICE_URL
        ? {
            COWARDS_RUNTIME_SERVICE_URL:
              process.env.COWARDS_RUNTIME_SERVICE_URL,
          }
        : {}),
      ...(process.env.COWARDS_OWNER_DEBUG_REQUESTER_PLAYER_ID
        ? {
            COWARDS_OWNER_DEBUG_REQUESTER_PLAYER_ID:
              process.env.COWARDS_OWNER_DEBUG_REQUESTER_PLAYER_ID,
          }
        : {}),
      ...(process.env.DATABASE_URL
        ? { DATABASE_URL: process.env.DATABASE_URL }
        : {}),
      ...(process.env.REDIS_URL ? { REDIS_URL: process.env.REDIS_URL } : {}),
    },
  },
  projects: [
    {
      name: "desktop",
      use: {
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "tablet",
      use: {
        browserName: "chromium",
        viewport: { width: 900, height: 1100 },
      },
    },
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        hasTouch: true,
        isMobile: true,
        viewport: { width: 390, height: 844 },
      },
    },
  ],
})
