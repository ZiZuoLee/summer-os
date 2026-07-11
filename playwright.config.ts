import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const realAuth = process.env.E2E_REAL_AUTH === "true";
const systemChrome = process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === "true";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  snapshotPathTemplate:
    "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}",
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
      threshold: 0.3,
    },
  },
  use: {
    baseURL,
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: systemChrome ? "chrome" : undefined,
      },
    },
    {
      name: "android",
      use: {
        ...devices["Pixel 7"],
        channel: systemChrome ? "chrome" : undefined,
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --port 3100",
        url: baseURL,
        env: {
          ...process.env,
          NEXT_PUBLIC_DEMO_MODE: realAuth ? "false" : "true",
          NEXT_PUBLIC_SITE_URL: baseURL,
          ...(realAuth
            ? {}
            : {
                NEXT_PUBLIC_SUPABASE_URL: "",
                NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
                NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
                NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
                TURNSTILE_SECRET_KEY: "",
              }),
        },
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
