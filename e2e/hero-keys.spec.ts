import { test, expect, devices } from '@playwright/test';

const KEYBOARD_CAPTION = 'Press one — these caps light up as you type.';
const TOUCH_CAPTION = 'The keys the first lessons teach.';

test('a phone is not told to press a key it does not have', async ({ browser }) => {
  const context = await browser.newContext(devices['Pixel 7']);
  const page = await context.newPage();
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'The editor wants a keyboard' })).toBeVisible();
  await expect(page.getByText(TOUCH_CAPTION)).toBeVisible();
  await expect(
    page.getByText(KEYBOARD_CAPTION),
    'the hero must not ask for a keypress in the same panel that says there is no keyboard',
  ).toHaveCount(0);

  await context.close();
});

test('a laptop still gets the instruction, and the caps that answer it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  await expect(page.getByText(KEYBOARD_CAPTION)).toBeVisible();
  await expect(page.getByText(TOUCH_CAPTION)).toHaveCount(0);

  const cap = page.locator('.clay-key[data-key="w"]').first();
  await expect(cap).toBeVisible();
  await page.keyboard.down('w');
  await expect(cap).toHaveAttribute('data-pressed', '');
  await page.keyboard.up('w');
  await expect(cap).not.toHaveAttribute('data-pressed', '');
});

test('the server HTML carries the keyboard caption, not the touch one', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  await page.goto('/');

  const text = await page.locator('main').innerText();
  expect(text).toContain(KEYBOARD_CAPTION);
  expect(text).not.toContain(TOUCH_CAPTION);

  await context.close();
});
