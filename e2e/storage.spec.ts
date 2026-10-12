import { test, expect, type Page } from '@playwright/test';

async function denied(page: Page, route: string) {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Failed to read localStorage: access is denied', 'SecurityError');
      },
    });
  });
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto(route);
  await page.locator('main').waitFor({ timeout: 15_000 });
  return page;
}

test('/stats with storage denied says so, and stops saying "solve an exercise first"', async ({
  page,
}) => {
  const frame = await denied(page, '/stats');

  await expect(frame.getByTestId('storage-denied')).toBeVisible({ timeout: 15_000 });
  await expect(frame.getByRole('heading', { name: 'Nothing can be recorded here' })).toBeVisible();

  const main = await frame.locator('main').innerText();
  expect(main, 'the first-visit copy must not show when storage is the problem').not.toMatch(
    /solve an exercise first|Solve one exercise|Nothing recorded yet|waiting for its first attempt/,
  );
});

test('a lesson with storage denied tells the learner the attempt will not count', async ({
  page,
}) => {
  const frame = await denied(page, '/learn/hjkl');
  await expect(frame.getByTestId('storage-notice')).toBeVisible({ timeout: 15_000 });
  await expect(frame.getByTestId('storage-notice')).toHaveText(/not storing attempts/);
});

test('a practice stage with storage denied tells the learner the attempt will not count', async ({
  page,
}) => {
  const frame = await denied(page, '/practice/speedrun.modes.enter-insert');
  await expect(frame.getByTestId('storage-notice')).toBeVisible({ timeout: 15_000 });
});

for (const route of ['/stats', '/learn/hjkl', '/practice/speedrun.modes.enter-insert']) {
  test(`${route} with working storage shows no storage notice`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto(route, { waitUntil: 'networkidle' });
    if (route === '/stats') {
      await expect(page.getByRole('heading', { name: 'Nothing recorded yet' })).toBeVisible();
    } else {
      await page.locator('.cm-content').first().waitFor({ timeout: 15_000 });
    }
    await expect(page.getByTestId('storage-denied')).toHaveCount(0);
    await expect(page.getByTestId('storage-notice')).toHaveCount(0);
  });
}
