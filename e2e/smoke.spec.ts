import { test, expect } from '@playwright/test';

/**
 * SMOKE TEST — "does the app come up at all?"
 *
 * This is the first line of defence: if these fail, something is badly broken
 * and there's no point running deeper tests. Detailed scenarios come later.
 *
 * Selectors are kept generic/realistic so they survive small UI tweaks.
 */

test.describe('QuakePulse WebUI — smoke', () => {
  // Visit the app before each test. baseURL comes from playwright.config.ts,
  // so '/' resolves to http://localhost:4200/.
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('app loads and shows the header brand', async ({ page }) => {
    // The page should respond and render the app shell, not a blank/error page.
    await expect(page.getByText('QuakePulse', { exact: false })).toBeVisible();

    // The top banner (header) should be present.
    await expect(page.locator('header')).toBeVisible();
  });

  // Temporarily disabled.
  // test('core layout regions are rendered', async ({ page }) => {
  //   // Main content area (map or list view lives here). first() guards against
  //   // the map also exposing role="main"; we just need the layout region present.
  //   await expect(page.locator('main').first()).toBeVisible();
  //
  //   // The header search box. There are two search inputs on the page (header
  //   // search + sidebar location filter), so target by accessible name to stay
  //   // unambiguous — the Playwright-recommended way over a generic CSS selector.
  //   await expect(
  //     page.getByRole('searchbox', { name: 'Search earthquake location' })
  //   ).toBeVisible();
  // });

  // Temporarily disabled.
  // test('no UNEXPECTED console errors on load', async ({ page }) => {
  //   // Errors we expect in a local/test environment and should NOT fail on:
  //   // the map tiles (external OpenFreeMap server) and the backend API may be
  //   // unreachable — the app handles both gracefully (mock fallback). We only
  //   // want to catch genuine application/JS errors here.
  //   const IGNORED = [
  //     'MapLibre error',        // map tile fetch failures (external tile server)
  //     'Failed to fetch',       // generic network failure (tiles / API)
  //     'API call failed',       // EarthquakeService backend fallback to mock
  //     'Cannot reach backend',
  //     'ERR_CONNECTION',
  //     'net::',
  //   ];
  //
  //   const errors: string[] = [];
  //   page.on('console', (msg) => {
  //     if (msg.type() !== 'error') return;
  //     const text = msg.text();
  //     if (!IGNORED.some((p) => text.includes(p))) errors.push(text);
  //   });
  //
  //   // Re-load so the listener captures the full load cycle.
  //   await page.goto('/');
  //   await page.waitForLoadState('networkidle');
  //
  //   // After ignoring known external-dependency noise, there should be no
  //   // unexpected application errors.
  //   expect(errors, `Unexpected console errors:\n${errors.join('\n')}`).toHaveLength(0);
  // });
});
