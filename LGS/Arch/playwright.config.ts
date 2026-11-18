import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT || 3100);

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: { baseURL: `http://localhost:${port}`, locale: "ru-RU" },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
  webServer: {
    // Сборка и запуск как в продакшне: Next.js не разрешает два dev-сервера в одной папке
    command: `npx next build && npx next start -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 240_000,
    env: {
      NEXT_TELEMETRY_DISABLED: "1",
      DISABLE_RATE_LIMIT: "1",
      PGLITE_DIR: ".data/pglite-e2e",
      SITE_URL: `http://localhost:${port}`,
    },
  },
});
