import { test, expect } from '@playwright/test';

test('the hero editor arrives in one hop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('.cm-content').first().waitFor({ timeout: 15_000 });

  const resources = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .filter((r) => r.name.endsWith('.js'))
      .map((r) => ({
        name: r.name,
        startTime: r.startTime,
        responseEnd: (r as PerformanceResourceTiming).responseEnd,
      })),
  );
  const bodies = new Map<string, string>();
  for (const r of resources) bodies.set(r.name, await (await page.request.get(r.name)).text());

  const hero = resources.filter((r) => bodies.get(r.name)!.includes('hero-delete-slow'));
  const editor = resources.filter((r) => bodies.get(r.name)!.includes('cm-scroller'));
  expect(hero.length, 'a chunk carrying the hero exercise was loaded').toBeGreaterThan(0);
  expect(editor.length, 'a chunk carrying CodeMirror was loaded').toBeGreaterThan(0);

  const heroDone = Math.min(...hero.map((r) => r.responseEnd));
  const editorStart = Math.max(...editor.map((r) => r.startTime));
  expect(
    editorStart,
    `editor chunk requested at ${editorStart.toFixed(0)}ms, hero chunk finished at ${heroDone.toFixed(0)}ms`,
  ).toBeLessThanOrEqual(heroDone);
});
