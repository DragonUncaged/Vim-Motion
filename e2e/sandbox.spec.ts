import { test, expect, type Page } from '@playwright/test';

async function sandbox(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto('/sandbox');
  await page.locator('.cm-content').first().waitFor({ timeout: 15_000 });
  return page;
}

async function buffer(page: Page): Promise<string> {
  return (await page.locator('.cm-content').first().innerText()).replace(/​/g, '');
}

// Through the DOM, not `fill`: vim reads keydowns from a capture listener a value set never reaches.
async function keys(page: Page, text: string) {
  const overlay = page.getByTestId('focus-overlay');
  if ((await overlay.count()) > 0) await overlay.click();
  else await page.locator('.cm-content').first().click();
  await expect(page.locator('.cm-content').first()).toBeFocused();
  await page.keyboard.type(text, { delay: 10 });
}

async function paste(page: Page, text: string) {
  await page.getByTestId('sandbox-own').click();
  const box = page.locator('#sandbox-paste');
  await box.waitFor();
  await box.fill(text);
  await page.getByRole('button', { name: 'Load it into the editor' }).click();
}

test('pasted code is loaded, editable with vim, and still there after a reload', async ({
  page,
}) => {
  await sandbox(page);
  await paste(page, 'const answer = 41;\nconst spare = 0;\n');
  await expect(page.locator('.cm-content').first()).toContainText('const answer = 41;');

  await keys(page, 'jwcwkept');
  await page.keyboard.press('Escape');
  await expect(page.locator('.cm-content').first()).toContainText('const kept = 0;');

  await page.reload();
  await page.locator('.cm-content').first().waitFor({ timeout: 15_000 });
  expect(await buffer(page)).toContain('const answer = 41;');
  await expect(page.getByTestId('sandbox-own')).toHaveAttribute('aria-pressed', 'true');
});

test('the language picker is remembered along with the text', async ({ page }) => {
  await sandbox(page);
  await paste(page, 'package main\n\nfunc main() {}\n');

  await page.getByTestId('sandbox-own').click();
  await page.getByRole('button', { name: 'Go', exact: true }).last().click();
  await expect(page.locator('.cm-content').first()).toContainText('package main');

  await page.reload();
  await page.locator('.cm-content').first().waitFor({ timeout: 15_000 });
  await page.getByTestId('sandbox-own').click();
  await expect(page.getByRole('button', { name: 'Go', exact: true }).last()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('opening a file reads it in the browser and names the buffer after it', async ({ page }) => {
  await sandbox(page);
  await page.getByTestId('sandbox-own').click();

  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));

  await page.getByTestId('sandbox-file').setInputFiles({
    name: 'ring.cpp',
    mimeType: 'text/plain',
    buffer: Buffer.from('int head = 0;\nint tail = 0;\n'),
  });

  await expect(page.locator('.cm-content').first()).toContainText('int head = 0;');
  await expect(page.getByText('ring.cpp').first()).toBeVisible();
  await page.getByTestId('sandbox-own').click();
  await expect(page.getByRole('button', { name: 'C++', exact: true }).last()).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  const origin = new URL(page.url()).origin;
  expect(
    requests.filter((u) => !u.startsWith(origin)),
    'reading a file must not talk to anything',
  ).toEqual([]);
});

test('a file over the cap is truncated, and the page says so in one line', async ({ page }) => {
  await sandbox(page);
  await page.getByTestId('sandbox-own').click();

  const line = 'x'.repeat(79) + '\n';
  await page.getByTestId('sandbox-file').setInputFiles({
    name: 'big.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(line.repeat(2000)),
  });

  const notice = page.getByTestId('sandbox-notice');
  await expect(notice).toBeVisible();
  await expect(notice).toHaveText(/100,000 characters/);
  await expect(page.locator('.cm-content').first()).toContainText('xxxxx');
});

test('switching back to a sample leaves your own file where it was', async ({ page }) => {
  await sandbox(page);
  await paste(page, 'mine\n');
  await page.getByRole('button', { name: 'Go', exact: true }).first().click();
  await expect(page.locator('.cm-content').first()).toContainText('package');

  await page.getByTestId('sandbox-own').click();
  await expect(page.locator('#sandbox-paste')).toHaveValue('mine\n');
});
