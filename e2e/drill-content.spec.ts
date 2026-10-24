import { test, expect, type Page } from '@playwright/test';

// Not the prompt: its bare `.clay-prose` is shared with the category blurb, so it passes without a body.
async function stageIsPlayable(page: Page) {
  await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-testid="exercise-placeholder"]')).toHaveCount(0);
  await expect(page.getByText(/^par \d+ keys$/)).toBeVisible();
  const text = await page.locator('.cm-content').innerText();
  expect(text.trim().length, 'the editor mounted with an empty document').toBeGreaterThan(0);
}

test('a category drill loads its exercises and plays', async ({ page }) => {
  await page.goto('/practice/word-motions');
  await stageIsPlayable(page);
  await expect(page.getByText(/Exercise 1 of \d+/)).toBeVisible();
});

test('my weakest — the drill whose category is the whole curriculum — plays', async ({ page }) => {
  await page.goto('/practice/weakest');
  await stageIsPlayable(page);
  await expect(page.getByText(/Exercise 1 of \d+/)).toBeVisible();
});

test('a speedrun on a named exercise loads that exercise', async ({ page }) => {
  await page.goto('/practice/speedrun.modes.enter-insert');
  await stageIsPlayable(page);
  await expect(page.locator('.cm-content')).toContainText('Modes decide what your keys mean.');
});

test('an unnamed speedrun picks one and loads it', async ({ page }) => {
  await page.goto('/practice/speedrun');
  await stageIsPlayable(page);
});

test('the picker counts every category without any exercise body', async ({ page }) => {
  await page.goto('/practice');
  const counts = await page.getByText(/\d+ exercises?/).allInnerTexts();
  expect(counts.length).toBeGreaterThan(0);
  for (const text of counts) {
    expect(Number.parseInt(text, 10), `a category card says "${text}"`).toBeGreaterThan(0);
  }
});
