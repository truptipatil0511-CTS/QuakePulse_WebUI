import { Page } from '@playwright/test';

/**
 * Shared test helpers. Kept tiny on purpose — no Page Object Model.
 *
 * Strategy: we intercept the two external dependencies so tests are fast,
 * deterministic, and run with NO backend and NO internet:
 *   1. the earthquake API  → returns a fixed, filterable fixture
 *   2. the map style/tiles → returns a minimal offline style so the map
 *      actually finishes loading (otherwise the map controls never render)
 */

export interface QuakeFixture {
  id: string;
  magnitude: number;
  location: string;
  time: string;
  longitude: number;
  latitude: number;
  depth: number;
}

/** 5 events spread across magnitude bands and regions — easy to assert on. */
export const FIXTURE: QuakeFixture[] = [
  { id: '1', magnitude: 2.1, location: 'Near Delhi, India',     time: '2026-06-22T08:00:00Z', longitude: 77.2,   latitude: 28.6,  depth: 10 },
  { id: '2', magnitude: 4.5, location: 'Off Honshu, Japan',     time: '2026-06-22T06:00:00Z', longitude: 141.0,  latitude: 38.3,  depth: 35 },
  { id: '3', magnitude: 5.8, location: 'Coquimbo, Chile',       time: '2026-06-21T22:00:00Z', longitude: -71.3,  latitude: -30.0, depth: 55 },
  { id: '4', magnitude: 7.2, location: 'Sulawesi, Indonesia',   time: '2026-06-21T12:00:00Z', longitude: 120.0,  latitude: -1.5,  depth: 20 },
  { id: '5', magnitude: 6.1, location: 'Northern California',   time: '2026-06-20T15:00:00Z', longitude: -122.5, latitude: 38.0,  depth: 8  },
];

// Minimal valid MapLibre style with no external tiles → the map loads
// instantly and offline, so map.on('load') fires and mapReady becomes true.
const STUB_STYLE = {
  version: 8,
  sources: {},
  layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#dfe6e9' } }],
};

/** Intercept the map style + raster tiles so the map renders offline. */
export async function stubMapStyle(page: Page): Promise<void> {
  await page.route(/openfreemap\.org\/styles\/.*/i, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(STUB_STYLE) })
  );
  // Satellite style pulls raster tiles from ArcGIS — return a 1x1 transparent
  // PNG so it doesn't error or hit the network.
  await page.route(/server\.arcgisonline\.com\/.*/i, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from([]) })
  );
}

interface MockOpts {
  /** Non-200 to simulate an API failure. */
  status?: number;
  /** Pass null for an empty dataset; omit to use FIXTURE. */
  data?: QuakeFixture[] | null;
}

/**
 * Intercept the earthquake API. Mirrors the real backend: filters the fixture
 * by the magnitude/location query params the app sends, so filter tests are
 * realistic and deterministic.
 */
export async function mockEarthquakes(page: Page, opts: MockOpts = {}): Promise<void> {
  await page.route(/\/api\/Earthquake/i, (route, request) => {
    if (opts.status && opts.status !== 200) {
      route.fulfill({ status: opts.status, contentType: 'application/json', body: '{"error":"failure"}' });
      return;
    }
    const url = new URL(request.url());
    const min = parseFloat(url.searchParams.get('minMagnitude') ?? '0');
    const max = parseFloat(url.searchParams.get('maxMagnitude') ?? '10');
    const loc = (url.searchParams.get('location') ?? '').toLowerCase();

    const source = opts.data === null ? [] : (opts.data ?? FIXTURE);
    const data = source.filter(
      (q) => q.magnitude >= min && q.magnitude <= max && (loc === '' || q.location.toLowerCase().includes(loc))
    );

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        metadata: { count: data.length, source: 'test', timestamp: '2026-06-22T00:00:00Z', cached: false },
        data,
      }),
    });
  });
}

/** Register all mocks, then open the app. Call this in beforeEach / at test start. */
export async function gotoApp(page: Page, mockOpts: MockOpts = {}): Promise<void> {
  await stubMapStyle(page);
  await mockEarthquakes(page, mockOpts);
  // waitUntil 'domcontentloaded' (not the default 'load') so navigation
  // resolves without waiting for every heavy resource; our assertions
  // auto-wait for the elements they need anyway.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
}

/**
 * Set an <input type="range"> value. range inputs can't use locator.fill(),
 * so we set the value and dispatch the events Angular's form listens to.
 */
export async function setRange(page: Page, selector: string, value: number): Promise<void> {
  await page.locator(selector).evaluate((el, v) => {
    const input = el as HTMLInputElement;
    input.value = String(v);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}
