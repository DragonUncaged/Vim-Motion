import { test, expect, type Page } from '@playwright/test';

const ROUTES = [
  '/',
  '/learn',
  '/learn/hjkl',
  '/practice',
  '/practice/word-motions',
  '/practice/speedrun',
  '/sandbox',
  '/cheatsheet',
  '/stats',
  '/about',
  '/no-such-page',
] as const;

const WIDTHS = [375, 768, 1440] as const;
const THEMES = ['light', 'dark'] as const;

interface Watched {
  errors: string[];
  external: string[];
}

// Nothing may leave the origin (docs/CONTRACT.md §0); Chrome's own 404 log is the one allowed console line.
function watch(page: Page): Watched {
  const errors: string[] = [];
  const external: string[] = [];

  page.on('console', (message) => {
    const type = message.type();
    if (type !== 'error' && type !== 'warning') return;
    if (/status of 404/.test(message.text()) && /no-such-page/.test(page.url())) return;
    errors.push(`[${type}] ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`[pageerror] ${error.message}`));
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (!url.protocol.startsWith('http')) return;
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return;
    external.push(url.href);
  });

  return { errors, external };
}

async function pageState(page: Page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    dark: document.documentElement.classList.contains('dark'),
  }));
}

for (const theme of THEMES) {
  for (const width of WIDTHS) {
    for (const route of ROUTES) {
      test(`${route} @${width} ${theme}: no sideways scroll, clean console, no third party`, async ({
        page,
      }) => {
        const { errors, external } = watch(page);
        await page.addInitScript((t) => localStorage.setItem('vimclay:v1:theme', t), theme);
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route, { waitUntil: 'networkidle' });

        const state = await pageState(page);
        expect(state.dark, 'theme stamped on <html> before first paint').toBe(theme === 'dark');
        expect(state.scrollWidth, 'document scrollWidth <= clientWidth').toBeLessThanOrEqual(
          state.clientWidth,
        );
        expect(errors, 'console errors and warnings').toEqual([]);
        expect(external, 'requests leaving the origin').toEqual([]);
      });
    }
  }
}

test('the hero survives a long typed line @1440', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const content = page.locator('.cm-content').first();
  await content.waitFor({ timeout: 15_000 });

  const h1 = page.locator('h1').first();
  const before = await h1.boundingBox();
  expect(before, 'the hero h1 is on the page').not.toBeNull();

  await page.getByTestId('focus-overlay').click();
  await expect(content).toBeFocused();
  await page.keyboard.press('i');
  await page.keyboard.type('x'.repeat(160));

  const after = await h1.boundingBox();
  const state = await pageState(page);
  const scroller = await page.evaluate(() => {
    const element = document.querySelector('.cm-scroller');
    if (element === null) throw new Error('no .cm-scroller');
    return { clientWidth: element.clientWidth, scrollWidth: element.scrollWidth };
  });

  expect(after!.height, 'the h1 must not re-wrap when the editor is typed into').toBe(
    before!.height,
  );
  expect(state.scrollWidth, 'the document must not scroll sideways').toBeLessThanOrEqual(
    state.clientWidth,
  );
  expect(scroller.scrollWidth, 'the long line scrolls inside .cm-scroller').toBeGreaterThan(
    scroller.clientWidth,
  );
});

test('a long unbroken cheatsheet description cannot widen the page @375', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/cheatsheet');

  const row = page.locator('#cheat-h');
  await row.waitFor({ timeout: 15_000 });

  const before = await pageState(page);
  expect(before.scrollWidth, 'clean before the injection').toBeLessThanOrEqual(before.clientWidth);

  await row.evaluate((element) => {
    const cell = element.children[1];
    if (cell === undefined) throw new Error('#cheat-h has no second cell to widen');
    const target = cell.querySelector('span') ?? cell;
    target.textContent = 'ThisIsAVeryLongUnbrokenIdentifierLikeAFileNameOrCommandOption';
  });

  const after = await pageState(page);
  expect(after.scrollWidth, 'a long description must not scroll the page').toBeLessThanOrEqual(
    after.clientWidth,
  );
});

test('every header tab stop shows the site focus ring', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/learn');

  const rings: { label: string; outlineWidth: string }[] = [];
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press('Tab');
    rings.push(
      await page.evaluate(() => {
        const active = document.activeElement as HTMLElement;
        return {
          label: (active.getAttribute('aria-label') ?? active.textContent ?? '')
            .trim()
            .slice(0, 30),
          outlineWidth: getComputedStyle(active).outlineWidth,
        };
      }),
    );
  }

  const weak = rings.filter((ring) => parseFloat(ring.outlineWidth) < 3);
  expect(weak, 'every header stop takes the 3px clay ring, not the browser default').toEqual([]);
});

const EDITOR_SURFACES = [
  { route: '/', name: 'hero' },
  // `change`, not `modes`: the first key of `modes` solves its exercise and moves focus away.
  { route: '/learn/change', name: 'lesson' },
  // Not `weakest`: it can sample an exercise whose `allowedKeys` ends the attempt after a few keys.
  { route: '/practice/text-objects', name: 'drill' },
  { route: '/sandbox', name: 'sandbox' },
] as const;

for (const { route, name } of EDITOR_SURFACES) {
  test(`the ${name} editor frame does not grow when thirty lines are typed @1440`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(route);

    const content = page.locator('.cm-content').first();
    await content.waitFor({ timeout: 15_000 });
    const frame = page.locator('.clay-editor').first();

    const geometry = () =>
      page.evaluate(() => {
        const scroller = document.querySelector('.cm-scroller');
        const cursor = document.querySelector('.cm-cursor-primary, .cm-cursor');
        const frame = document.querySelector('.clay-editor');
        if (scroller === null || frame === null) throw new Error('no editor on the page');
        const s = scroller.getBoundingClientRect();
        const c = cursor?.getBoundingClientRect() ?? null;
        // The next element, not the page height: a solved lesson legitimately grows a results panel.
        const next = frame.nextElementSibling ?? frame.parentElement!.nextElementSibling;
        return {
          below: next === null ? null : Math.round(next.getBoundingClientRect().top + scrollY),
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          scrolled: scroller.scrollTop,
          cursorInside: c !== null && c.top >= s.top - 1 && c.bottom <= s.bottom + 1,
        };
      });

    const before = { frame: (await frame.boundingBox())!.height, ...(await geometry()) };

    const overlay = page.getByTestId('focus-overlay');
    if ((await overlay.count()) > 0) await overlay.click();
    await expect(content).toBeFocused();
    await page.keyboard.press('i');
    for (let i = 1; i <= 30; i++) {
      await page.keyboard.type(`line ${i}`);
      await page.keyboard.press('Enter');
    }

    const after = { frame: (await frame.boundingBox())!.height, ...(await geometry()) };

    expect(after.frame, 'the editor frame is the height it was before typing').toBe(before.frame);
    expect(after.below, 'the element under the editor has not moved').toBe(before.below);
    expect(after.scrollWidth, 'the page did not grow sideways').toBeLessThanOrEqual(
      after.clientWidth,
    );
    expect(after.scrolled, 'the buffer scrolled inside the frame').toBeGreaterThan(0);
    expect(after.cursorInside, 'the cursor line is still in view').toBe(true);
  });
}
