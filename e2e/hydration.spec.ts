import { test, expect, type Page } from '@playwright/test';

const CLS_BUDGET = 0.05;

// Lighthouse's desktop viewport.
const DESKTOP = { width: 1350, height: 940 };

// Throttled because unthrottled localhost can hydrate before first paint and score 0 on a broken page.
async function layoutShift(page: Page, route: string, settled: (page: Page) => Promise<void>) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 40,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await page.addInitScript(() => {
    const w = window as unknown as { __cls: number };
    w.__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & {
        hadRecentInput: boolean;
        value: number;
      })[]) {
        if (!entry.hadRecentInput) w.__cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.setViewportSize(DESKTOP);
  await page.goto(route, { waitUntil: 'networkidle' });
  await settled(page);
  await page.waitForTimeout(500);
  return page.evaluate(() => (window as unknown as { __cls: number }).__cls);
}

test('/practice/[drill] keeps its shape through hydration (CLS)', async ({ page }) => {
  const cls = await layoutShift(page, '/practice/weakest', async (p) => {
    await p.locator('.cm-content').first().waitFor({ timeout: 20_000 });
  });
  expect(cls, 'summed layout shift on /practice/weakest').toBeLessThan(CLS_BUDGET);
});

test('/stats keeps its shape through hydration (CLS)', async ({ page }) => {
  const cls = await layoutShift(page, '/stats', async (p) => {
    await expect(p.getByRole('heading', { name: 'Nothing recorded yet' })).toBeVisible();
  });
  expect(cls, 'summed layout shift on /stats').toBeLessThan(CLS_BUDGET);
});

for (const route of ['/learn/hjkl', '/practice/weakest', '/practice/speedrun']) {
  test(`${route}: the first frame is an exercise-shaped placeholder, not the keyboard notice`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      javaScriptEnabled: false,
    });
    const page = await context.newPage();
    await page.goto(route);

    await expect(page.getByTestId('exercise-placeholder')).toHaveCount(1);
    const text = await page.locator('main').innerText();
    expect(text, 'the server HTML must not decide the visitor has no keyboard').not.toContain(
      'The exercises need a keyboard',
    );
    expect(text, 'the one-line hydration panel is gone').not.toContain('Finding you an exercise…');
    await context.close();
  });
}

// Not `cm-editor`: LessonRunner names that class, so the lesson's own chunk carries it.
async function fetchedEditor(page: Page, route: string, width: number) {
  const scripts: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(request.url());
  });
  await page.setViewportSize({ width, height: 900 });
  await page.goto(route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const bodies = await Promise.all(
    scripts.map((url) => page.request.get(url).then((r) => r.text())),
  );
  return bodies.some((body) => body.includes('cm-scroller'));
}

test('a phone still never downloads the editor for a lesson @375', async ({ page }) => {
  const editor = await fetchedEditor(page, '/learn/hjkl', 375);
  await expect(page.getByRole('heading', { name: 'The exercises need a keyboard' })).toBeVisible();
  await expect(page.getByTestId('exercise-placeholder')).toHaveCount(0);
  expect(editor, 'no script containing CodeMirror was requested').toBe(false);
});

test('a laptop does download the editor for a lesson @1440 (control)', async ({ page }) => {
  const editor = await fetchedEditor(page, '/learn/hjkl', 1440);
  await expect(page.locator('.cm-content').first()).toBeVisible();
  expect(editor, 'the CodeMirror chunk was requested').toBe(true);
});
