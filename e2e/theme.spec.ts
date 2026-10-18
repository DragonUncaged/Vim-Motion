import { test, expect } from '@playwright/test';

test('a first visit is dark, whatever the OS prefers', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const dark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  expect(dark, 'nothing stored → dark').toBe(true);
  await expect(page.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
});

test('the switch has two segments, moves with the arrows, and remembers light', async ({
  page,
}) => {
  await page.goto('/');
  const group = page.getByRole('radiogroup', { name: 'Colour theme' });
  await expect(group.getByRole('radio')).toHaveCount(2);
  await expect(group.getByRole('radio', { name: 'System' })).toHaveCount(0);

  const stops = await group
    .getByRole('radio')
    .evaluateAll((els) => els.map((el) => el.getAttribute('tabindex')));
  expect(stops.filter((t) => t === '0')).toHaveLength(1);

  await group.getByRole('radio', { name: 'Dark' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(group.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true');
  await expect(group.getByRole('radio', { name: 'Light' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(
    false,
  );

  await page.reload();
  expect(
    await page.evaluate(() => document.documentElement.classList.contains('dark')),
    'light survives a reload',
  ).toBe(false);
  await expect(page.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true');
});

test("an old stored 'system' reads as dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => localStorage.setItem('vimclay:v1:theme', 'system'));
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);
  await expect(page.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
});
