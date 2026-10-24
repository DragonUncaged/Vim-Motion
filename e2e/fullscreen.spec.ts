import { test, expect, type Page } from '@playwright/test';

const SURFACES = [
  // `change`, not `modes`: the first key of `modes` solves its exercise and moves focus away.
  { route: '/learn/change', name: 'lesson' },
  // Not `weakest`: it can sample an exercise whose `allowedKeys` ends the attempt after a few keys.
  { route: '/practice/text-objects', name: 'drill' },
] as const;

async function frameBox(page: Page) {
  return page.evaluate(() => {
    const frame = document.querySelector('.clay-editor');
    if (frame === null) throw new Error('no editor frame on the page');
    const r = frame.getBoundingClientRect();
    return {
      x: Math.round(r.x + scrollX),
      y: Math.round(r.y + scrollY),
      width: Math.round(r.width),
      height: Math.round(r.height),
    };
  });
}

async function openEditor(page: Page, route: string) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(route);
  await page.locator('.cm-content').first().waitFor({ timeout: 15_000 });
}

for (const { route, name } of SURFACES) {
  test(`the ${name} editor expands over the viewport and puts everything back @1440`, async ({
    page,
  }) => {
    await openEditor(page, route);

    await page.evaluate(() => window.scrollTo(0, 150));
    expect(await page.evaluate(() => Math.round(scrollY)), 'the page scrolls at rest').toBe(150);

    const before = await frameBox(page);
    const flowHeight = await page.evaluate(() => document.documentElement.scrollHeight);

    const toggle = page.getByTestId('fullscreen-toggle');
    await toggle.focus();
    await page.evaluate(() => document.activeElement?.setAttribute('data-e2e-was-focused', 'yes'));
    await page.keyboard.press('Enter');

    const frame = page.locator('[data-fullscreen="true"]');
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute('role', 'dialog');

    const expanded = await page.evaluate(() => {
      const el = document.querySelector('[data-fullscreen="true"]')!;
      const r = el.getBoundingClientRect();
      const scrim = [...document.querySelectorAll('div')].find(
        (d) => getComputedStyle(d).position === 'fixed' && d.getAttribute('aria-hidden') === 'true',
      );
      const s = scrim?.getBoundingClientRect() ?? null;
      return {
        position: getComputedStyle(el).position,
        frame: { x: r.x, y: r.y, width: r.width, height: r.height },
        scrim: s === null ? null : { x: s.x, y: s.y, width: s.width, height: s.height },
        vw: window.innerWidth,
        vh: window.innerHeight,
        overflow: getComputedStyle(document.documentElement).overflow,
        scrollHeight: document.documentElement.scrollHeight,
      };
    });

    expect(expanded.position, 'the frame is a fixed overlay').toBe('fixed');
    expect(expanded.scrim, 'the scrim covers the whole viewport').toEqual({
      x: 0,
      y: 0,
      width: expanded.vw,
      height: expanded.vh,
    });
    expect(expanded.frame.width / expanded.vw, 'the frame spans the viewport').toBeGreaterThan(0.9);
    expect(expanded.frame.height / expanded.vh, 'the frame fills the viewport').toBeGreaterThan(
      0.9,
    );
    expect(expanded.frame.x, 'centred horizontally').toBeCloseTo(
      expanded.vw - expanded.frame.x - expanded.frame.width,
      1,
    );
    expect(expanded.frame.y, 'centred vertically').toBeCloseTo(
      expanded.vh - expanded.frame.y - expanded.frame.height,
      1,
    );
    expect(expanded.frame.height, 'expanded is taller than at rest').toBeGreaterThan(before.height);

    expect(expanded.scrollHeight, 'the page behind the overlay has not reflowed').toBe(flowHeight);

    // `overflow: hidden` stops user scrolling but not `window.scrollTo`, so assert with a wheel gesture.
    expect(expanded.overflow, 'the document stops scrolling').toBe('hidden');
    await page.mouse.move(5, 5);
    await page.mouse.wheel(0, 400);
    expect(
      await page.evaluate(() => Math.round(scrollY)),
      'the page behind the overlay does not scroll',
    ).toBe(150);

    await expect(page.locator('.cm-content').first()).toBeFocused();

    const modeLabel = page.getByTestId('vim-mode-label');
    const keyLog = page.getByTestId('keystroke-log');

    await page.keyboard.press('i');
    await expect(modeLabel, 'mode changes still reach the status bar').toHaveText('-- INSERT --');
    await page.keyboard.type('x');
    await expect(
      keyLog.locator('.clay-key').first(),
      'the keystroke log still fills',
    ).toBeVisible();

    // Esc must never close the overlay; see components/editor/fullScreen.tsx.
    await page.keyboard.press('Escape');
    await expect(modeLabel).toHaveText('-- NORMAL --');
    await expect(frame, 'Escape leaving insert mode does not close full screen').toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(frame, 'the Esc Esc focus hatch does not close full screen either').toHaveCount(1);

    await expect(toggle).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.locator('[data-fullscreen="true"]')).toHaveCount(0);

    const after = await frameBox(page);
    expect(after, 'the frame is back in the flow exactly where it was').toEqual(before);

    const restored = await page.evaluate(() => ({
      overflow: getComputedStyle(document.documentElement).overflow,
      paddingRight: document.documentElement.style.paddingRight,
      scrollY: Math.round(scrollY),
      focusStamped: document.activeElement?.getAttribute('data-e2e-was-focused'),
      scrims: [...document.querySelectorAll('div')].filter(
        (d) => getComputedStyle(d).position === 'fixed' && d.getAttribute('aria-hidden') === 'true',
      ).length,
    }));

    expect(restored.overflow, 'the document scrolls again').not.toBe('hidden');
    expect(restored.paddingRight, 'the scrollbar gutter is handed back').toBe('');
    expect(restored.scrollY, 'the reader is where they were').toBe(150);
    expect(restored.scrims, 'the scrim is gone').toBe(0);
    expect(restored.focusStamped, 'focus went back to the element that had it').toBe('yes');
  });
}

test('the expanded frame does not grow when thirty lines are typed @1440', async ({ page }) => {
  await openEditor(page, '/learn/change');

  await page.getByTestId('fullscreen-toggle').click();
  const frame = page.locator('[data-fullscreen="true"]');
  await expect(frame).toHaveCount(1);
  await expect(page.locator('.cm-content').first()).toBeFocused();

  const geometry = () =>
    page.evaluate(() => {
      const scroller = document.querySelector('.cm-scroller');
      const el = document.querySelector('[data-fullscreen="true"]');
      if (scroller === null || el === null) throw new Error('no expanded editor on the page');
      const s = scroller.getBoundingClientRect();
      const c = document.querySelector('.cm-cursor-primary, .cm-cursor')?.getBoundingClientRect();
      return {
        frame: Math.round(el.getBoundingClientRect().height),
        scrolled: scroller.scrollTop,
        cursorInside: c !== undefined && c.top >= s.top - 1 && c.bottom <= s.bottom + 1,
      };
    });

  const before = await geometry();

  await page.keyboard.press('i');
  for (let i = 1; i <= 30; i++) {
    await page.keyboard.type(`line ${i}`);
    await page.keyboard.press('Enter');
  }

  const after = await geometry();

  expect(after.frame, 'the expanded frame is the height it was').toBe(before.frame);
  expect(after.scrolled, 'the buffer scrolled inside the frame').toBeGreaterThan(0);
  expect(after.cursorInside, 'the cursor line is still in view').toBe(true);
});
