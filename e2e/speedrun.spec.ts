import { test, expect } from '@playwright/test';

test('after a first solve the sidebar no longer claims there is no solved run', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/practice/speedrun.modes.enter-insert');

  const sidebar = page.getByRole('heading', { name: 'Your record here' }).locator('..');
  await expect(sidebar).toContainText('No solved run yet');

  await page.locator('.cm-content').first().waitFor({ timeout: 15_000 });
  const overlay = page.getByTestId('focus-overlay');
  if ((await overlay.count()) > 0) await overlay.click();
  await expect(page.locator('.cm-content').first()).toBeFocused();
  await page.keyboard.press('i');

  await expect(page.getByRole('heading', { name: 'That is your ghost set' })).toBeVisible();
  await expect(sidebar).not.toContainText('No solved run yet');
  await expect(sidebar).toContainText('is now the time to beat');
});

test('a second run watches the first one replay, key by key', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/practice/speedrun.words.hop-to-cheese');

  const focusEditor = async () => {
    await page.locator('.cm-content').first().waitFor({ timeout: 15_000 });
    const overlay = page.getByTestId('focus-overlay');
    if ((await overlay.count()) > 0) await overlay.click();
    await expect(page.locator('.cm-content').first()).toBeFocused();
  };

  await expect(page.getByTestId('ghost-keys')).toHaveCount(0);

  await focusEditor();
  await page.keyboard.press('w');
  await page.waitForTimeout(700);
  await page.keyboard.press('w');
  await expect(page.getByRole('heading', { name: 'That is your ghost set' })).toBeVisible();

  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem('vimclay:v1:attempts');
    const blob = raw === null ? { attempts: [] } : JSON.parse(raw);
    return blob.attempts.map((a: { timeline?: { key: string; ms: number }[] }) => a.timeline);
  });
  expect(stored).toHaveLength(1);
  expect(stored[0].map((k: { key: string }) => k.key)).toEqual(['w', 'w']);
  expect(stored[0][0].ms).toBe(0);
  expect(stored[0][1].ms).toBeGreaterThan(400);

  await page.getByRole('button', { name: 'Run it again' }).click();

  const keys = page.getByTestId('ghost-keys');
  const count = page.getByTestId('ghost-key-count');
  await expect(keys).toBeVisible();

  await expect(count).toHaveText('0 of 2');
  await expect(keys).toContainText('starts when you press your first key');
  await page.waitForTimeout(1_500);
  await expect(count).toHaveText('0 of 2');

  await focusEditor();
  await page.keyboard.press('w');
  await expect(count).toHaveText('1 of 2');
  await expect(count).toHaveText('2 of 2', { timeout: 3_000 });

  await expect(page.locator('.cm-content').first()).toBeFocused();
  await page.keyboard.press('w');
  await expect(
    page.getByRole('heading', { name: /personal best|best still stands/i }),
  ).toBeVisible();
});

test('a best from before the replay existed still races as a bar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/practice/speedrun.words.hop-to-cheese');
  await page.evaluate(() => {
    localStorage.setItem(
      'vimclay:v1:attempts',
      JSON.stringify({
        version: 1,
        attempts: [
          {
            exerciseId: 'hop-to-cheese',
            lessonSlug: 'words',
            motions: ['w'],
            timeMs: 2200,
            keystrokes: 2,
            wastedKeys: 0,
            par: 2,
            solved: true,
            at: Date.now() - 86_400_000,
          },
        ],
      }),
    );
  });
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Your record here' })).toBeVisible();
  await expect(page.getByTestId('ghost-keys')).toHaveCount(0);
  await expect(page.getByLabel('your previous best, 2.2s')).toBeVisible();
});

// The pause goes between the keys: the clock starts on the first, so a one-key run cannot reliably lose.
test('the sidebar counts the run that has just finished', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/practice/speedrun.words.hop-to-cheese');

  const sidebar = page.getByRole('heading', { name: 'Your record here' }).locator('..');
  const focusEditor = async () => {
    await page.locator('.cm-content').first().waitFor({ timeout: 15_000 });
    const overlay = page.getByTestId('focus-overlay');
    if ((await overlay.count()) > 0) await overlay.click();
    await expect(page.locator('.cm-content').first()).toBeFocused();
  };

  await focusEditor();
  await page.keyboard.press('w');
  await page.keyboard.press('w');
  await expect(page.getByRole('heading', { name: 'That is your ghost set' })).toBeVisible();

  await page.getByRole('button', { name: 'Run it again' }).click();
  await focusEditor();
  await page.keyboard.press('w');
  await page.waitForTimeout(1_500);
  await page.keyboard.press('w');
  await expect(page.getByRole('heading', { name: 'Your best still stands' })).toBeVisible();

  const solved = await page.evaluate(() => {
    const raw = localStorage.getItem('vimclay:v1:attempts');
    const blob = raw === null ? { attempts: [] } : JSON.parse(raw);
    return blob.attempts.filter((a: { solved: boolean }) => a.solved).length;
  });
  expect(solved, 'both runs were solved and stored').toBe(2);
  await expect(sidebar, 'the line must not report fewer runs than the store holds').toContainText(
    '2 solved runs on record',
  );
});
