import { test, expect } from '@playwright/test';

const nav = (key: 'j' | 'k') => `Control+${key}`;

test('Ctrl+j goes to the next lesson and Ctrl+k comes back', async ({ page }) => {
  await page.goto('/learn/hjkl');
  await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 20_000 });

  await page.keyboard.press(nav('j'));
  await expect(page).not.toHaveURL(/\/learn\/hjkl$/);
  const forward = new URL(page.url()).pathname;

  await page.keyboard.press(nav('k'));
  await expect(page).toHaveURL(/\/learn\/hjkl$/);
  expect(forward).not.toBe('/learn/hjkl');
});

test('the prev and next links agree with the keys', async ({ page }) => {
  await page.goto('/learn/hjkl');
  const next = page.getByRole('link', { name: /^Next: / });
  const previous = page.getByRole('link', { name: /^Back to / });
  await expect(next).toBeVisible();
  await expect(previous).toBeVisible();

  const nextHref = await next.getAttribute('href');
  await page.locator('body').press(nav('j'));
  await expect(page).toHaveURL(new RegExp(`${nextHref}$`));
});

test('the first lesson offers no way backwards', async ({ page }) => {
  await page.goto('/learn/modes');
  await expect(page.getByRole('link', { name: /^Back to / })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /^Next: / })).toBeVisible();

  await page.locator('body').press(nav('k'));
  await expect(page).toHaveURL(/\/learn\/modes$/);
});
