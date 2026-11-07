import { test, expect, type Page } from '@playwright/test';

async function expand(page: Page, route: string) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(route);
  await page.locator('.cm-content').first().waitFor({ timeout: 15_000 });
  await page.getByTestId('fullscreen-toggle').click();
  await expect(page.locator('[data-fullscreen="true"]')).toHaveCount(1);
  await expect(page.locator('.cm-content').first()).toBeFocused();
}

const inFrame = (page: Page) =>
  page.locator('[data-fullscreen="true"] [data-testid="expanded-outcome"]');

test('solving in full screen says so inside the frame @1440', async ({ page }) => {
  await expand(page, '/learn/tsx-hooks');

  await expect(page.getByTestId('keystroke-log')).toHaveCount(1);
  await expect(inFrame(page)).toBeEmpty();

  await page.keyboard.press('%');

  const outcome = inFrame(page);
  await expect(outcome).toBeVisible();
  await expect(outcome).toContainText('Solved');
  for (const label of ['time', 'keystrokes', 'efficiency', 'accuracy']) {
    await expect(outcome).toContainText(label);
  }
  await expect(outcome.getByRole('button', { name: 'Try it again' })).toBeVisible();
  await expect(outcome.getByRole('button', { name: 'Next exercise' })).toBeVisible();

  await expect(outcome).toHaveAttribute('role', 'status');
  await expect(outcome).toHaveAttribute('aria-live', 'polite');

  await expect(page.getByTestId('keystroke-log')).toHaveCount(0);

  await expect(outcome.locator(':focus')).toHaveCount(1);

  await outcome.getByRole('button', { name: 'Try it again' }).click();
  await expect(page.locator('[data-fullscreen="true"]'), 'still in full screen').toHaveCount(1);
  await expect(inFrame(page)).toBeEmpty();
  await expect(page.getByTestId('keystroke-log'), 'the key log has the row back').toHaveCount(1);
  await expect(page.locator('.cm-content').first()).toBeFocused();
});

test('a speedrun result lands inside the expanded frame @1440', async ({ page }) => {
  await expand(page, '/practice/speedrun.modes.enter-insert');

  await page.keyboard.press('i');

  const outcome = inFrame(page);
  await expect(outcome).toBeVisible();
  await expect(outcome).toContainText('That is your ghost set');
  await expect(outcome.getByRole('button', { name: 'Run it again' })).toBeVisible();
  await expect(outcome.getByRole('heading', { name: 'Solved' })).toHaveCount(0);
});

test('a drill in full screen carries the outcome region @1440', async ({ page }) => {
  await expand(page, '/practice/text-objects');

  const outcome = inFrame(page);
  await expect(outcome).toHaveCount(1);
  await expect(outcome).toBeEmpty();
  await expect(outcome).toHaveAttribute('role', 'status');
  await expect(page.getByTestId('keystroke-log'), 'the key log has the row mid-run').toHaveCount(1);
});

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

test('the sandbox frame is unchanged by all of this @1440', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/sandbox');
  await page.locator('.cm-content').first().waitFor({ timeout: 15_000 });
  await page.getByTestId('fullscreen-toggle').click();
  await expect(page.locator('[data-fullscreen="true"]')).toHaveCount(1);

  await expect(page.getByTestId('keystroke-log'), 'the key log keeps its row').toHaveCount(1);
  const height = await inFrame(page).evaluate((el) => el.getBoundingClientRect().height);
  expect(height, 'an empty outcome region takes no room').toBe(0);
});
