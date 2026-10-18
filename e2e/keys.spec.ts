import { test, expect } from '@playwright/test';

test('c then w quickly presses the cw cap; c, a pause, then w does not', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/learn/change');
  await page.locator('h1').first().click();

  const cw = page.locator('[data-key="cw"]').first();
  const w = page.locator('[data-key="w"]').first();
  await expect(cw).toBeVisible();

  await page.keyboard.press('c');
  await page.keyboard.down('w');
  await expect(cw, 'cw lights while w is held right after c').toHaveAttribute('data-pressed', '');
  await page.keyboard.up('w');
  await expect(cw, 'and comes back up with w').not.toHaveAttribute('data-pressed', '');

  await page.keyboard.press('c');
  await page.waitForTimeout(800);
  await page.keyboard.down('w');
  await expect(w.or(cw).first()).toBeVisible();
  await expect(cw, 'a c from 800ms ago is not part of this w').not.toHaveAttribute(
    'data-pressed',
    '',
  );
  await page.keyboard.up('w');
});

test('a single cap is unchanged: it is down exactly while its key is', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/learn/change');
  await page.locator('h1').first().click();
  const c = page.locator('[data-key="C"]').first();
  await expect(c).toBeVisible();
  await page.keyboard.down('Shift');
  await page.keyboard.down('C');
  await expect(c).toHaveAttribute('data-pressed', '');
  await page.keyboard.up('C');
  await page.keyboard.up('Shift');
  await expect(c).not.toHaveAttribute('data-pressed', '');
});
