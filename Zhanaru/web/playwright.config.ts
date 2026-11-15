import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:4333' },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4333',
    url: 'http://localhost:4333',
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    { name: 'iphone-se', use: { ...devices['iPhone SE'], browserName: 'chromium' } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
});
