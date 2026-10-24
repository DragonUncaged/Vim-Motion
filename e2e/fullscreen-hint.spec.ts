import { test, expect } from '@playwright/test';

test('the expanded frame says what Esc Esc actually does there @1440', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/learn/tsx-hooks');
  await page.locator('.cm-content').first().waitFor({ timeout: 15_000 });

  const strip = page.locator('.clay-editor-title');
  await expect(strip).toContainText('leaves the editor');
  await expect(strip).not.toContainText('leaves full screen');

  await page.getByTestId('fullscreen-toggle').click();
  await expect(page.locator('[data-fullscreen="true"]')).toHaveCount(1);

  await expect(strip, 'the hint names the mode it is in').toContainText('leaves full screen');
  await expect(strip.locator('.clay-key')).toHaveText(['Esc', 'Esc', 'CR']);

  await expect(page.locator('.cm-content').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('fullscreen-toggle')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-fullscreen="true"]')).toHaveCount(0);
  await expect(strip).toContainText('leaves the editor');
});
