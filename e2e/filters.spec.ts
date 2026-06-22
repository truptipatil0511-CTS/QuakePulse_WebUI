import { test, expect } from '@playwright/test';
import { gotoApp, setRange } from './helpers';

/**
 * Filters panel + search + summary + reset.
 * These are DOM-driven and the highest-value, most reliable tests.
 */
test.describe('Filters, search & summary', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page); // mocks API (FIXTURE = 5 events) and map style
  });

  // Reusable locators for the summary cards.
  const totalCard = (page: import('@playwright/test').Page) =>
    page.getByRole('status', { name: 'Total earthquakes' });
  const highestCard = (page: import('@playwright/test').Page) =>
    page.getByRole('status', { name: 'Highest magnitude' });

  // ── B. Search functionality ────────────────────────────────
  test('B: entering a location filters the data', async ({ page }) => {
    await expect(totalCard(page)).toContainText('5'); // all events to start
    await page.getByRole('searchbox', { name: 'Search earthquake location' }).fill('India');
    await expect(totalCard(page)).toContainText('1'); // only the India event
  });

  test('B: invalid search is handled gracefully (0 results, no crash)', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Search earthquake location' }).fill('Atlantis');
    await expect(totalCard(page)).toContainText('0');
    await expect(page.locator('header')).toBeVisible(); // app still alive
  });

  test('B: clearing the search restores the default results', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: 'Search earthquake location' });
    await search.fill('India');
    await expect(totalCard(page)).toContainText('1');
    await search.fill('');
    await expect(totalCard(page)).toContainText('5');
  });

  // ── C. Date range filter ───────────────────────────────────
  test('C: a date preset triggers a reload with date params', async ({ page }) => {
    // Wait for the API call the preset will trigger (proves the wiring works).
    const req = page.waitForRequest(
      (r) => /\/api\/Earthquake/i.test(r.url()) && r.url().includes('startDate')
    );
    await page.getByRole('button', { name: '24h' }).click();
    await req;
  });

  // ── C. Magnitude filter ────────────────────────────────────
  test('C: magnitude filter shows only matching events', async ({ page }) => {
    await expect(totalCard(page)).toContainText('5');
    // Min magnitude 5 → only 5.8, 6.1, 7.2 remain.
    await setRange(page, 'input[aria-label="Minimum magnitude"]', 5);
    await expect(totalCard(page)).toContainText('3');
    await expect(highestCard(page)).toContainText('M7.2');
  });

  // ── C. Location filter (sidebar) ───────────────────────────
  test('C: sidebar location filter narrows results', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Filter by location' }).fill('Japan');
    await expect(totalCard(page)).toContainText('1');
    await expect(highestCard(page)).toContainText('M4.5');
  });

  // ── G. Summary panel ───────────────────────────────────────
  test('G: summary reflects the dataset', async ({ page }) => {
    await expect(totalCard(page)).toContainText('5');
    await expect(highestCard(page)).toContainText('M7.2'); // strongest fixture event
  });

  test('G: summary updates when a filter is applied', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Search earthquake location' }).fill('Indonesia');
    await expect(totalCard(page)).toContainText('1');
    await expect(highestCard(page)).toContainText('M7.2');
  });

  // ── I. Reset functionality ─────────────────────────────────
  test('I: reset clears filters back to defaults', async ({ page }) => {
    await setRange(page, 'input[aria-label="Minimum magnitude"]', 5);
    await expect(totalCard(page)).toContainText('3');

    await page.getByRole('button', { name: 'Reset all filters' }).click();

    await expect(totalCard(page)).toContainText('5');           // all events back
    await expect(page.getByText('M0.0')).toBeVisible();          // min badge reset
  });
});
