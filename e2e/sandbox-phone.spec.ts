import { test, expect, devices } from '@playwright/test';

const SOURCE_BUTTONS = ['Plain text', 'React + TypeScript', 'Go', 'C++', 'Your own file'];

test('a phone is not offered controls for the editor it is told it cannot have', async ({
  browser,
}) => {
  const context = await browser.newContext(devices['Pixel 7']);
  const page = await context.newPage();
  await page.goto('/sandbox');

  await expect(page.getByRole('heading', { name: 'The editor needs a keyboard' })).toBeVisible();
  for (const name of SOURCE_BUTTONS) {
    await expect(
      page.getByRole('button', { name, exact: true }),
      `"${name}" configures an editor this page does not render`,
    ).toHaveCount(0);
  }
  await expect(page.getByRole('button', { name: /^Reset to/ })).toHaveCount(0);
  await expect(page.getByTestId('sandbox-own')).toHaveCount(0);

  await expect(page.getByRole('heading', { name: 'Normal mode' })).toBeVisible();
  await expect(
    page.getByText('Press a key and this panel narrows to what can follow it.'),
    'the reference must not ask for a keypress on a device with no keys',
  ).toHaveCount(0);

  await context.close();
});

test('a laptop still gets the whole picker (control)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/sandbox');
  await page.locator('.cm-content').first().waitFor({ timeout: 15_000 });

  for (const name of SOURCE_BUTTONS) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: /^Reset to/ })).toBeVisible();
  await expect(
    page.getByText('Press a key and this panel narrows to what can follow it.'),
  ).toBeVisible();
});

test('the server HTML carries the picker', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  await page.goto('/sandbox');

  const text = await page.locator('main').innerText();
  expect(text).toContain('Your own file');
  expect(text).not.toContain('The editor needs a keyboard');

  await context.close();
});
