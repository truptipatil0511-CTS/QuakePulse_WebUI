import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

/**
 * Map interaction, view toggle and style switching.
 *
 * NOTE: earthquake markers/clusters are drawn on a WebGL canvas, not the DOM,
 * so we cannot assert their count/colour/popup via selectors. These tests
 * verify the surrounding DOM controls work and the app never crashes.
 */
test.describe('Map & views', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  // ── E. View toggle (Map ↔ List) ────────────────────────────
  test('E: switch to List shows rows, switch back to Map', async ({ page }) => {
    const viewToggle = page.getByRole('group', { name: 'Select view mode' });

    await viewToggle.getByRole('button', { name: 'List' }).click();
    await expect(page.locator('.list-view')).toBeVisible();
    await expect(page.locator('.list-count')).toContainText('5'); // 5 fixture events
    await expect(page.locator('.list-item').first()).toBeVisible();

    await viewToggle.getByRole('button', { name: 'Map' }).click();
    await expect(page.locator('.map-container')).toBeVisible();
  });

  // ── D. Map interaction (DOM-level smoke) ───────────────────
  test('D: zoom controls are present and clickable', async ({ page }) => {
    await expect(page.locator('.map-container')).toBeVisible();
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await page.getByRole('button', { name: 'Zoom out' }).click();
    await page.getByRole('button', { name: 'Fit map to visible earthquakes' }).click();
    await expect(page.locator('header')).toBeVisible(); // no crash
  });

  // ── F. Map style switching ─────────────────────────────────
  test('F: switching styles updates the active button without crashing', async ({ page }) => {
    // Scope to the map style controls — "Dark" otherwise also matches the
    // header's "Switch to dark mode" theme toggle.
    const styleControls = page.getByRole('group', { name: 'Map style controls' });
    for (const name of ['Dark', 'Satellite', 'Standard']) {
      const btn = styleControls.getByRole('button', { name });
      await btn.click();
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
    }
    await expect(page.locator('.map-container')).toBeVisible();
  });

  test('F: heatmap toggle shows the heatmap legend', async ({ page }) => {
    const heatmapBtn = page
      .getByRole('group', { name: 'Map style controls' })
      .getByRole('button', { name: 'Heatmap' });

    await heatmapBtn.click();
    await expect(page.locator('.map-heatmap-legend')).toBeVisible();

    await heatmapBtn.click();
    await expect(page.locator('.map-heatmap-legend')).toBeHidden();
  });
});
