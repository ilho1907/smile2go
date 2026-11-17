import { defineConfig, devices } from "@playwright/test";

/* E2E-Tests gegen den gebauten Stand (vite preview).
   Nutzt das installierte Google Chrome (channel "chrome") – auf dem Mac ist
   daher kein zusätzlicher Browser-Download nötig. */
export default defineConfig({
  testDir: "./tests",
  testMatch: /.*\.spec\.js/,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:5181", channel: "chrome" },
  webServer: { command: "npx vite preview --port 5181 --strictPort", url: "http://localhost:5181", reuseExistingServer: true, timeout: 30_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1366, height: 860 } } },
    { name: "mobil", use: { ...devices["Pixel 7"], channel: "chrome" } },
  ],
});
