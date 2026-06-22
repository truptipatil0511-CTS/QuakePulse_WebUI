import { defineConfig, devices } from '@playwright/test';

/**
 * Minimal, reliable Playwright config for the QuakePulse WebUI POC.
 * Docs: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Where the e2e tests live (kept separate from Angular's *.spec.ts unit tests).
  testDir: './e2e',

  // Fail the build if you accidentally leave test.only in the source.
  forbidOnly: !!process.env.CI,

  // Retry once locally, twice on CI — smooths over occasional flakiness.
  retries: process.env.CI ? 2 : 1,

  // Per-test timeout. Generous because this is a heavy Angular app (large
  // MapLibre bundle + WebGL init) served by an unoptimized dev server.
  timeout: 60_000,

  // IMPORTANT: run serially. Multiple workers hammering `ng serve` at once
  // make page.goto() exceed its timeout (dev server can't serve the heavy
  // bundle to several tabs simultaneously). One worker = reliable. Bump this
  // up once you serve a production build or run on a faster machine.
  workers: 1,
  fullyParallel: false,

  // Nice HTML report you can open after a run.
  reporter: [['html', { open: 'never' }], ['list']],

  // Settings shared by every test.
  use: {
    // So tests can call page.goto('/') instead of the full URL.
    baseURL: process.env.BASE_URL || 'http://localhost:4200',

    // Capture evidence only when something fails (keeps runs fast/clean).
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',

    // Reliability: generous timeouts so a cold Angular dev-server compile on
    // the first navigation can't fail the early tests.
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
  },

  // Per-assertion timeout (e.g. expect(...).toBeVisible()).
  expect: { timeout: 15_000 },

  // One browser is plenty for a POC. Add firefox/webkit later if needed.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  /**
   * Auto-start the Angular dev server before tests, and shut it down after.
   * If a server is already running on :4200, it's reused (faster local loop).
   */
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000, // Angular's first compile can be slow.
  },
});
