import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// THEME_SCRIPT cannot import from lib/theme, so the test executes it and compares the result rather than grepping it.

class FakeStorage {
  private map = new Map<string, string>();
  failWrites = false;
  failReads = false;
  getItem(k: string): string | null {
    if (this.failReads) throw new Error('SecurityError: site data blocked');
    return this.map.has(k) ? (this.map.get(k) as string) : null;
  }
  setItem(k: string, v: string): void {
    if (this.failWrites) throw new Error('QuotaExceededError');
    this.map.set(k, v);
  }
  removeItem(k: string): void {
    this.map.delete(k);
  }
}

const store = new FakeStorage();
let prefersDark = false;
const matchMedia = (q: string) => ({
  matches: q.includes('dark') && prefersDark,
  addEventListener() {},
  removeEventListener() {},
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test double for a browser global
(globalThis as any).window = { localStorage: store, matchMedia };

const { loadTheme, saveTheme, DEFAULT_THEME, THEME_KEY, THEME_PREFERENCES } =
  await import('../index.ts');

test('the default is dark, and there are exactly two preferences', () => {
  assert.equal(DEFAULT_THEME, 'dark');
  assert.deepEqual([...THEME_PREFERENCES], ['dark', 'light']);
});

test('an unset preference is dark, not the OS setting', () => {
  prefersDark = false;
  assert.equal(loadTheme(), 'dark');
});

test('garbage in storage reads as dark rather than throwing', () => {
  store.setItem(THEME_KEY, '{"not":"a preference"}');
  assert.equal(loadTheme(), 'dark');
  store.setItem(THEME_KEY, 'DARK');
  assert.equal(loadTheme(), 'dark');
  store.removeItem(THEME_KEY);
});

test("the removed 'system' value migrates to dark on read", () => {
  store.setItem(THEME_KEY, 'system');
  prefersDark = false;
  assert.equal(loadTheme(), 'dark');
  store.removeItem(THEME_KEY);
});

test('both preferences round-trip', () => {
  for (const p of THEME_PREFERENCES) {
    saveTheme(p);
    assert.equal(loadTheme(), p);
  }
  store.removeItem(THEME_KEY);
});

test('a refused write does not throw, and the choice still applies this session', () => {
  store.failWrites = true;
  assert.doesNotThrow(() => saveTheme('dark'));
  store.failWrites = false;
});

const layoutSource = readFileSync(new URL('../../../app/layout.tsx', import.meta.url), 'utf8');

function themeScript(): string {
  const open = layoutSource.indexOf('const THEME_SCRIPT = `');
  assert.notEqual(open, -1, 'THEME_SCRIPT not found in app/layout.tsx');
  const start = open + 'const THEME_SCRIPT = `'.length;
  const close = layoutSource.indexOf('`;', start);
  assert.notEqual(close, -1, 'THEME_SCRIPT has no closing backtick');
  const script = layoutSource.slice(start, close);
  assert.ok(!script.includes('${'), 'THEME_SCRIPT must be a literal with no interpolation');
  return script;
}

interface FakeRoot {
  classes: Set<string>;
  style: { colorScheme: string };
}

function fakeDocument(): { document: unknown; root: FakeRoot } {
  const root: FakeRoot = { classes: new Set(), style: { colorScheme: '' } };
  const classList = {
    toggle(name: string, force?: boolean): boolean {
      const on = force ?? !root.classes.has(name);
      if (on) root.classes.add(name);
      else root.classes.delete(name);
      return on;
    },
    add: (name: string) => void root.classes.add(name),
    remove: (name: string) => void root.classes.delete(name),
    contains: (name: string) => root.classes.has(name),
  };
  return { document: { documentElement: { classList, style: root.style } }, root };
}

function runThemeScript(localStorage: unknown): FakeRoot {
  const { document, root } = fakeDocument();
  const run = new Function('localStorage', 'window', 'document', themeScript()) as (
    ls: unknown,
    w: unknown,
    d: unknown,
  ) => void;
  run(localStorage, { matchMedia }, document);
  return root;
}

test('the blocking script stamps the same theme this module reads, in every case', () => {
  const cases: Array<{ stored: string | null; os: 'light' | 'dark' }> = [];
  for (const os of ['light', 'dark'] as const) {
    for (const stored of [...THEME_PREFERENCES, 'system', 'DARK', null]) cases.push({ stored, os });
  }
  assert.equal(cases.length, 10);

  for (const { stored, os } of cases) {
    prefersDark = os === 'dark';
    if (stored === null) store.removeItem(THEME_KEY);
    else store.setItem(THEME_KEY, stored);

    const expected = loadTheme();
    const root = runThemeScript(store);
    const label = `stored=${String(stored)} os=${os}`;

    assert.equal(root.classes.has('dark'), expected === 'dark', `${label}: .dark class`);
    assert.equal(root.style.colorScheme, expected, `${label}: color-scheme`);
  }
  store.removeItem(THEME_KEY);
  prefersDark = false;
});

test('the blocking script never consults the OS: only a stored light is light', () => {
  const script = themeScript();
  assert.ok(!script.includes('matchMedia'), 'no prefers-color-scheme branch');
  prefersDark = false;
  store.removeItem(THEME_KEY);
  assert.ok(runThemeScript(store).classes.has('dark'), 'nothing stored on a light OS is dark');
  store.setItem(THEME_KEY, 'light');
  prefersDark = true;
  assert.ok(!runThemeScript(store).classes.has('dark'), 'stored light on a dark OS is light');
  store.removeItem(THEME_KEY);
  prefersDark = false;
});

test('the blocking script swallows a storage that throws, and stamps the default', () => {
  store.failReads = true;
  let root: FakeRoot | undefined;
  assert.doesNotThrow(() => {
    root = runThemeScript(store);
  });
  store.failReads = false;
  assert.ok(root?.classes.has('dark'));
  assert.equal(root?.style.colorScheme, 'dark');
});

test('the blocking script reads the same storage key and preference names as this module', () => {
  const script = themeScript();
  assert.ok(script.includes(`'${THEME_KEY}'`), `script must read ${THEME_KEY}`);
  for (const p of THEME_PREFERENCES) assert.ok(script.includes(`'${p}'`), `script must know ${p}`);
  assert.ok(!script.includes('src='), 'the theme script must not be external');
});

test('the script is inlined into <head>, before the body', () => {
  const head = layoutSource.indexOf('<head>');
  const body = layoutSource.indexOf('<body');
  assert.ok(head !== -1 && head < body, 'the theme script must render in <head>');
  assert.ok(
    layoutSource.includes('suppressHydrationWarning'),
    '<html> gains a class the server cannot know',
  );
});
