import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

const apiScript = fileURLToPath(new URL("../server/tests/start-test-server.js", import.meta.url));

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5175",
    browserName: "chromium",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: `node "${apiScript}"`,
      url: "http://127.0.0.1:5105/api/health",
      timeout: 600000,
      reuseExistingServer: false,
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5175 --strictPort",
      url: "http://127.0.0.1:5175",
      env: { VITE_API_URL: "http://127.0.0.1:5105" },
      reuseExistingServer: false,
    },
  ],
});
