import { test, expect } from '@playwright/test';
import { gotoApp, setRange } from './helpers';

/**
 * H. END-TO-END FLOW (most important) — simulates a real user journey:
 * Load → Search → Filter → View map → Toggle to list → Change map style.
 */
test('H: full user journey stays consistent and never breaks', async ({ page }) => {
  await gotoApp(page);

  // 1. App loads
  await expect(page.getByText('QuakePulse')).toBeVisible();
  await expect(page.getByRole('status', { name: 'Total earthquakes' })).toContainText('5');

  // 2. Search a location, then clear it
  const search = page.getByRole('searchbox', { name: 'Search earthquake location' });
  await search.fill('Chile');
  await expect(page.getByRole('status', { name: 'Total earthquakes' })).toContainText('1');
  await search.fill('');
  await expect(page.getByRole('status', { name: 'Total earthquakes' })).toContainText('5');

  // 3. Apply a magnitude filter
  await setRange(page, 'input[aria-label="Minimum magnitude"]', 5);
  await expect(page.getByRole('status', { name: 'Total earthquakes' })).toContainText('3');

  // 4. Interact with the map
  await expect(page.locator('.map-container')).toBeVisible();
  await page.getByRole('button', { name: 'Zoom in' }).click();

  // 5. Toggle to the list view — data is consistent with the filter (3 events)
  const viewToggle = page.getByRole('group', { name: 'Select view mode' });
  await viewToggle.getByRole('button', { name: 'List' }).click();
  await expect(page.locator('.list-count')).toContainText('3');

  // 6. Back to map and change the style — no crash. Scope to the style
  // controls so "Dark" doesn't also match the header theme toggle.
  await viewToggle.getByRole('button', { name: 'Map' }).click();
  await page.getByRole('group', { name: 'Map style controls' }).getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('.map-container')).toBeVisible();
});
