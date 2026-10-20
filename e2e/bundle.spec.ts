import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { test, expect, type Page } from '@playwright/test';

// The same markers as scripts/bundle-check.mjs.
const PARSER_MARKERS = { tsx: 'javascriptLanguage', go: 'goLanguage', cpp: 'cppLanguage' } as const;

type Mode = keyof typeof PARSER_MARKERS;

// Not `cm-editor`: that string also appears in a page chunk as a plain CSS selector.
const EDITOR_MARKER = 'cm-vim';

function jsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return jsFiles(path);
    return entry.name.endsWith('.js') ? [path] : [];
  });
}

const CHUNKS = (() => {
  const parsers = new Map<string, Mode>();
  const editor = new Set<string>();
  for (const path of jsFiles('.next/static/chunks')) {
    const text = readFileSync(path, 'utf8');
    for (const [mode, marker] of Object.entries(PARSER_MARKERS)) {
      if (text.includes(marker)) parsers.set(basename(path), mode as Mode);
    }
    if (text.includes(EDITOR_MARKER)) editor.add(basename(path));
  }
  return { parsers, editor };
})();

interface Fetched {
  parsers: Set<Mode>;
  editor: boolean;
}

function watchChunks(page: Page): Fetched {
  const seen: Fetched = { parsers: new Set(), editor: false };
  page.on('request', (request) => {
    const name = basename(new URL(request.url()).pathname);
    const mode = CHUNKS.parsers.get(name);
    if (mode) seen.parsers.add(mode);
    if (CHUNKS.editor.has(name)) seen.editor = true;
  });
  return seen;
}

const tokens = (page: Page) => page.locator('.cm-content span[class^="ͼ"]');

async function openLesson(page: Page, slug: string) {
  await page.goto(`/learn/${slug}`);
  await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 20_000 });
}

test('the build has one chunk per mode and one for the editor core', () => {
  expect([...new Set(CHUNKS.parsers.values())].sort()).toEqual(['cpp', 'go', 'tsx']);
  expect(CHUNKS.editor.size).toBeGreaterThan(0);
  expect(CHUNKS.parsers.size).toBe(3);
});

test('a text lesson downloads the editor and not one byte of any parser', async ({ page }) => {
  const seen = watchChunks(page);
  await openLesson(page, 'modes');
  await page.waitForLoadState('networkidle');

  expect(seen.editor, 'the editor core never loaded, so this test proved nothing').toBe(true);
  expect([...seen.parsers]).toEqual([]);
  expect(await tokens(page).count()).toBe(0);
});

test('a Go lesson downloads the Go parser, highlights, and fetches neither of the others', async ({
  page,
}) => {
  const seen = watchChunks(page);
  await openLesson(page, 'go-args');

  await expect.poll(() => tokens(page).count(), { timeout: 20_000 }).toBeGreaterThan(0);

  expect(seen.editor).toBe(true);
  expect([...seen.parsers]).toEqual(['go']);
});

test('a TSX lesson downloads the JavaScript parser, not Go or C++', async ({ page }) => {
  const seen = watchChunks(page);
  await openLesson(page, 'tsx-strings');

  await expect.poll(() => tokens(page).count(), { timeout: 20_000 }).toBeGreaterThan(0);

  expect(seen.editor).toBe(true);
  expect([...seen.parsers]).toEqual(['tsx']);
});
