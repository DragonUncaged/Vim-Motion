import assert from 'node:assert/strict';
import test from 'node:test';

import { STORAGE_PREFIX } from '@/lib/progress';
import {
  CUSTOM_ID,
  DEFAULT_PREFS,
  MAX_CUSTOM,
  languageFromFilename,
  loadPrefs,
  prefsWritable,
  savePrefs,
  truncateCustom,
} from '../samples';

const KEY = `${STORAGE_PREFIX}sandbox`;

class FakeStorage {
  private map = new Map<string, string>();
  private frozen: boolean;
  // Not a parameter property: --experimental-strip-types cannot strip that syntax.
  constructor(frozen = false) {
    this.frozen = frozen;
  }
  getItem(k: string): string | null {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    if (this.frozen) throw new Error('quota exceeded');
    this.map.set(k, v);
  }
  removeItem(k: string): void {
    this.map.delete(k);
  }
}

function withStorage<T>(s: FakeStorage | null, fn: () => T): T {
  const g = globalThis as { window?: unknown };
  const had = 'window' in g;
  const before = g.window;
  g.window = s === null ? {} : { localStorage: s };
  try {
    return fn();
  } finally {
    if (had) g.window = before;
    else delete g.window;
  }
}

test('the extension is a guess, and an unknown one is plain text', () => {
  assert.equal(languageFromFilename('Store.tsx'), 'tsx');
  assert.equal(languageFromFilename('main.GO'), 'go');
  assert.equal(languageFromFilename('ring_buffer.hpp'), 'cpp');
  assert.equal(languageFromFilename('notes.txt'), 'text');
  assert.equal(languageFromFilename('Makefile'), 'text');
  assert.equal(languageFromFilename('.gitignore'), 'text');
});

test('text under the cap is returned untouched', () => {
  const t = truncateCustom('hello');
  assert.equal(t.text, 'hello');
  assert.equal(t.truncated, false);
});

test('text over the cap keeps its head and says so', () => {
  const t = truncateCustom('x'.repeat(MAX_CUSTOM + 10));
  assert.equal(t.text.length, MAX_CUSTOM);
  assert.equal(t.truncated, true);
});

test('a pasted file survives a round trip through storage', () => {
  const s = new FakeStorage();
  withStorage(s, () => {
    assert.equal(prefsWritable(), true);
    const ok = savePrefs({
      sampleId: CUSTOM_ID,
      language: 'go',
      custom: 'package main\n',
      customName: 'main.go',
    });
    assert.equal(ok, true);
    assert.deepEqual(loadPrefs(), {
      sampleId: CUSTOM_ID,
      language: 'go',
      custom: 'package main\n',
      customName: 'main.go',
    });
  });
});

test('a custom choice with nothing to show falls back to the first sample', () => {
  const s = new FakeStorage();
  withStorage(s, () => {
    savePrefs({ sampleId: CUSTOM_ID, language: 'go', custom: '', customName: '' });
    assert.deepEqual(loadPrefs(), DEFAULT_PREFS);
  });
});

test('an oversized blob written by hand is trimmed on the way out', () => {
  const s = new FakeStorage();
  withStorage(s, () => {
    s.setItem(
      KEY,
      JSON.stringify({
        version: 1,
        sampleId: CUSTOM_ID,
        language: 'text',
        custom: 'y'.repeat(MAX_CUSTOM + 500),
        customName: '',
      }),
    );
    assert.equal(loadPrefs().custom.length, MAX_CUSTOM);
  });
});

test('malformed JSON and an unknown version both degrade to the defaults', () => {
  const s = new FakeStorage();
  withStorage(s, () => {
    s.setItem(KEY, '{not json');
    assert.deepEqual(loadPrefs(), DEFAULT_PREFS);
    s.setItem(KEY, JSON.stringify({ version: 99, sampleId: CUSTOM_ID, custom: 'hi' }));
    assert.deepEqual(loadPrefs(), DEFAULT_PREFS);
  });
});

test('a browser that denies storage costs nothing', () => {
  withStorage(new FakeStorage(true), () => {
    assert.equal(prefsWritable(), false);
    assert.equal(
      savePrefs({ sampleId: CUSTOM_ID, language: 'text', custom: 'hi', customName: '' }),
      false,
    );
    assert.deepEqual(loadPrefs(), DEFAULT_PREFS);
  });
  withStorage(null, () => {
    assert.equal(prefsWritable(), false);
    assert.deepEqual(loadPrefs(), DEFAULT_PREFS);
  });
});
