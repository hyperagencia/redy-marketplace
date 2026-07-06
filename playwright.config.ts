import { defineConfig, devices } from '@playwright/test';

/**
 * E2E con Playwright. Reutiliza el dev server si ya está corriendo en :3000,
 * o lo levanta con `npm run dev`. Requiere `NEXT_PUBLIC_MP_TEST_BYPASS=1` en
 * `.env.local` para el flujo de compra (simula el pago sin MercadoPago).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
