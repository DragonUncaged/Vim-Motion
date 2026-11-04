import { test, expect, type Page } from '@playwright/test';

const BUFFER_TEXT = 'const habit';

async function focusEditor(page: Page) {
  await page.locator('.cm-content').first().waitFor({ timeout: 15_000 });
  const overlay = page.getByTestId('focus-overlay');
  if ((await overlay.count()) > 0) await overlay.click();
  await expect(page.locator('.cm-content').first()).toBeFocused();
}

async function clockMs(page: Page): Promise<number> {
  const text = (await page.getByTestId('attempt-time').innerText()).trim();
  const ms = /^(\d+)ms$/.exec(text);
  if (ms?.[1] !== undefined) return Number(ms[1]);
  const s = /^([\d.]+)s$/.exec(text);
  if (s?.[1] !== undefined) return Number(s[1]) * 1000;
  const ms2 = /^(\d+)m(?: (\d+)s)?$/.exec(text);
  if (ms2?.[1] !== undefined) return Number(ms2[1]) * 60_000 + Number(ms2[2] ?? 0) * 1000;
  throw new Error(`unreadable clock: ${JSON.stringify(text)}`);
}

for (const key of ['/', ':', '?']) {
  test(`pressing ${key} opens vim's command line without hiding the buffer`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/learn/search');
    await focusEditor(page);
    await expect(page.locator('.cm-content').first()).toContainText(BUFFER_TEXT);

    await page.keyboard.press(key);

    const prompt = page.locator('.cm-vim-panel input');
    await expect(prompt).toBeFocused();

    await expect(page.getByTestId('focus-overlay')).toHaveCount(0);
    await expect(page.locator('.cm-content').first()).toBeVisible();
    await expect(page.locator('.cm-content').first()).toContainText(BUFFER_TEXT);

    await page.keyboard.press('Escape');
    await expect(prompt).toHaveCount(0);
    await expect(page.locator('.cm-content').first()).toBeFocused();
    await expect(page.getByTestId('focus-overlay')).toHaveCount(0);
  });
}

// `h` on the first column changes nothing, so it starts the clock without solving the exercise.
test('the attempt clock runs while the editor is focused and stops when it is not', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/learn/search');
  await focusEditor(page);

  await expect(page.getByTestId('attempt-time')).toHaveText('0ms');
  await page.waitForTimeout(600);
  await expect(page.getByTestId('attempt-time')).toHaveText('0ms');

  await page.keyboard.press('h');
  await expect(page.getByRole('heading', { name: 'In progress' })).toBeVisible();

  const started = await clockMs(page);
  await page.waitForTimeout(800);
  const running = await clockMs(page);
  expect(running).toBeGreaterThan(started + 400);

  await page.locator('.cm-content').first().blur();
  await expect(page.getByTestId('focus-overlay')).toBeVisible();
  const paused = await clockMs(page);
  await page.waitForTimeout(1_500);
  expect(await clockMs(page)).toBe(paused);

  await focusEditor(page);
  const resumed = await clockMs(page);
  expect(resumed).toBeLessThan(paused + 1_000);
  await page.waitForTimeout(800);
  expect(await clockMs(page)).toBeGreaterThan(resumed + 400);
});

test('the clock keeps running while a search is being typed', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/learn/search');
  await focusEditor(page);

  await page.keyboard.press('h');
  await page.keyboard.press('/');
  await expect(page.locator('.cm-vim-panel input')).toBeFocused();

  const inPrompt = await clockMs(page);
  await page.waitForTimeout(900);
  expect(await clockMs(page)).toBeGreaterThan(inPrompt + 400);
  await expect(page.getByTestId('focus-overlay')).toHaveCount(0);
});

test('an editor nobody is in still offers the way back into it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/sandbox');
  await page.locator('.cm-content').first().waitFor({ timeout: 15_000 });

  const overlay = page.getByTestId('focus-overlay');
  await expect(overlay).toBeVisible();
  await overlay.click();
  await expect(page.locator('.cm-content').first()).toBeFocused();
  await expect(overlay).toHaveCount(0);
});
