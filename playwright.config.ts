import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
import { testOrigin, testPort } from "./tests/test-server";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: testOrigin,
    headless: true,
    launchOptions: {
      executablePath:
        process.env.CHROMIUM_PATH ||
        (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: `npm run dev -- --port ${testPort} --strictPort`,
    url: testOrigin,
    reuseExistingServer: true,
  },
});
