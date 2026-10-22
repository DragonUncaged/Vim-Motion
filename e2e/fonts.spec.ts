import { test, expect, type Page } from '@playwright/test';

const ROUTES = ['/', '/learn', '/learn/modes', '/practice', '/cheatsheet', '/stats', '/about'];

async function displayWeights(page: Page) {
  return page.evaluate(() => {
    // A computed font-family comes back re-quoted, so compare first family names unquoted.
    const first = (list: string) => (list.split(',')[0] ?? '').trim().replace(/^["']|["']$/g, '');
    const family = first(
      getComputedStyle(document.documentElement).getPropertyValue('--font-fredoka'),
    );
    const found: { tag: string; weight: string; text: string }[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      const style = getComputedStyle(el);
      if (!family || first(style.fontFamily) !== family) continue;
      if (!el.textContent?.trim()) continue;
      found.push({
        tag: el.tagName.toLowerCase(),
        weight: style.fontWeight,
        text: el.textContent.trim().slice(0, 40),
      });
    }
    return { family, found };
  });
}

for (const route of ROUTES) {
  test(`every display element on ${route} is painted at the one weight that is loaded`, async ({
    page,
  }) => {
    await page.goto(route);
    const { family, found } = await displayWeights(page);

    expect(family, 'next/font did not define --font-fredoka').not.toBe('');
    expect(found.length, `${route} paints nothing in the display face`).toBeGreaterThan(0);
    expect(found.filter((el) => el.weight !== '600')).toEqual([]);
  });
}

test('three font files are preloaded, one per family, and no more', async ({ page }) => {
  await page.goto('/');
  const preloaded = await page.evaluate(() =>
    [...document.querySelectorAll('link[rel="preload"][as="font"]')].map((link) =>
      link.getAttribute('href'),
    ),
  );
  expect(preloaded).toHaveLength(3);
});
