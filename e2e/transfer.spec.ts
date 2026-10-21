import { test, expect } from '@playwright/test';

const attempt = (id: string, at: number) => ({
  exerciseId: id,
  lessonSlug: 'modes',
  motions: ['i'],
  timeMs: 1200,
  keystrokes: 3,
  wastedKeys: 1,
  par: 2,
  solved: true,
  at,
});

test('an import that overflows the store reports what the store holds', async ({ page }) => {
  const stored = {
    version: 1,
    attempts: Array.from({ length: 4000 }, (_, i) => attempt(`s${i}`, i + 1)),
  };
  const file = {
    app: 'vim-clay',
    version: 1,
    exportedAt: 'x',
    attempts: Array.from({ length: 2000 }, (_, i) => attempt(`n${i}`, 10_000 + i)),
  };

  await page.addInitScript(
    (blob) => localStorage.setItem('vimclay:v1:attempts', blob),
    JSON.stringify(stored),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/stats');

  await page.getByRole('button', { name: 'Paste it instead' }).click();
  await page.getByLabel('Paste the contents of an exported file').fill(JSON.stringify(file));
  await page.getByRole('button', { name: 'Read what I pasted' }).click();
  await page.getByRole('button', { name: 'Merge them' }).click();

  const status = page.locator('p[aria-live="polite"]');
  await expect(status).toContainText('This browser now holds 5,000 attempts');
  await expect(status).toContainText('oldest were dropped');
  await expect(status).not.toContainText('6,000');
});
