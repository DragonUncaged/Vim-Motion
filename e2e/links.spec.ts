import { test, expect } from '@playwright/test';

import { modules } from '../content/modules';

test('two different module cards lead to two different places', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const cards = page.locator('a[href^="/learn#"]');
  await expect(cards).toHaveCount(modules.length);

  await cards.nth(0).click();
  await page.waitForURL(/\/learn#/);
  const first = page.url();
  const firstTarget = await page.evaluate(() => {
    const el = document.getElementById(location.hash.slice(1));
    return el === null ? null : el.getBoundingClientRect().top;
  });

  await page.goBack();
  await cards.nth(2).click();
  await page.waitForURL(/\/learn#/);
  const third = page.url();
  const thirdTarget = await page.evaluate(() => {
    const el = document.getElementById(location.hash.slice(1));
    return el === null ? null : el.getBoundingClientRect().top;
  });

  expect(third, 'two cards, two URLs').not.toBe(first);
  expect(firstTarget, 'the first module section exists').not.toBeNull();
  expect(thirdTarget, 'the third module section exists').not.toBeNull();
  expect(Math.abs(thirdTarget!), 'the third module section is scrolled into view').toBeLessThan(
    120,
  );
});

test('the three practice-mode cards have three destinations, and the speedrun card starts a run', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const card = (title: string) =>
    page
      .getByRole('heading', { level: 3, name: title, exact: true })
      .locator('..')
      .locator('a')
      .first();
  const hrefs = await Promise.all(
    ['Drill', 'Sandbox', 'Speedrun'].map((title) => card(title).getAttribute('href')),
  );
  expect(new Set(hrefs).size, `distinct destinations among ${hrefs.join(', ')}`).toBe(3);
  expect(hrefs[2], 'the speedrun card opens a run, not the picker').toBe('/practice/speedrun');

  await card('Speedrun').click();
  await page.waitForURL(/\/practice\/speedrun$/);
  await expect(page.getByText('Speedrun · one exercise, against the clock')).toBeVisible();
});
