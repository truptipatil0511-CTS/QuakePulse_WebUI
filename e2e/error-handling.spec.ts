import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

/**
 * J. Basic error handling — the app must stay usable when the API misbehaves.
 */
test.describe('Error handling', () => {
  // API failure: the app catches the error and falls back to mock data,
  // so it must NOT crash and the shell must still render.
  test('J: API failure does not crash the app', async ({ page }) => {
    await gotoApp(page, { status: 500 });

    await expect(page.getByText('QuakePulse')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main').first()).toBeVisible();
  });

  // Empty dataset: the list view should show its friendly empty state.
  test('J: empty data shows the empty state', async ({ page }) => {
    await gotoApp(page, { data: null }); // mock returns an empty array

    await expect(page.getByRole('status', { name: 'Total earthquakes' })).toContainText('0');

    // Switch to the list to see the empty-state message.
    await page.getByRole('group', { name: 'Select view mode' }).getByRole('button', { name: 'List' }).click();
    await expect(page.locator('.list-empty')).toBeVisible();
    await expect(page.locator('.list-empty')).toContainText('No earthquakes');
  });
});
