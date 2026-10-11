import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
const apiDirectory = process.env.TECHNOTES_API_DIR
  ? resolve(process.env.TECHNOTES_API_DIR)
  : ["../techNotes", "../technotes-api"]
      .map((path) => resolve(path))
      .find((path) => existsSync(`${path}/scripts/e2e-server.js`));
if (!apiDirectory)
  throw new Error(
    "Clone the techNotes API alongside this repository, run npm ci there, or set TECHNOTES_API_DIR.",
  );
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 30000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: [
    {
      command: "npm run start:e2e",
      cwd: apiDirectory,
      url: "http://127.0.0.1:4001/health",
      reuseExistingServer: false,
      timeout: 180000,
      env: { NODE_ENV: "test" },
    },
    {
      command: "npm run dev -- --port 4173 --strictPort",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: false,
      env: { API_PROXY_TARGET: "http://127.0.0.1:4001" },
    },
  ],
});
