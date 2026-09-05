import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeWindow } from './fake-storage.ts';
import { at } from '@/scripts/test-utils.ts';

const { store } = installFakeWindow();

const { exportProgress, importProgress, exportFilename, MAX_IMPORT_BYTES } =
  await import('../transfer.ts');
const { loadProgress, recordAttempt } = await import('../storage.ts');
const {
  ATTEMPTS_KEY,
  MAX_ATTEMPTS,
  MAX_COUNTER,
  MAX_FIELD_LENGTH,
  MAX_MOTIONS,
  MAX_TIME_VALUE,
  MAX_ATTEMPT_MS,
  parseAttempt,
} = await import('../schema.ts');

const attempt = (id: string, at: number) => ({
  exerciseId: id,
  lessonSlug: 'modes',
  motions: ['i'],
  timeMs: 1200,
  keystrokes: 3,
  wastedKeys: 1,
  par: 2,
  solved: true,
  at,
});

beforeEach(() => store.reset());

test('export then import round-trips every attempt', () => {
  recordAttempt(attempt('a', 1000));
  recordAttempt(attempt('b', 2000));
  const json = exportProgress();

  store.removeItem(ATTEMPTS_KEY);
  const result = importProgress(json);

  assert.equal(result.ok, true);
  assert.deepEqual(
    loadProgress().attempts.map((a) => a.exerciseId),
    ['a', 'b'],
  );
});

test('a ghost travels with the export, so a new laptop can race it', () => {
  const timeline = [
    { key: 'f', ms: 0 },
    { key: ';', ms: 210 },
  ];
  recordAttempt({ ...attempt('a', 1000), timeline });
  const json = exportProgress();
  assert.match(json, /"timeline"/, 'the export carries it rather than dropping it');

  store.removeItem(ATTEMPTS_KEY);
  assert.equal(importProgress(json).ok, true);
  assert.deepEqual(at(loadProgress().attempts, 0).timeline, timeline);
});

test('an export written before timelines existed imports unchanged', () => {
  const old = JSON.stringify({ version: 1, attempts: [attempt('a', 1000)] });
  assert.equal(importProgress(old).ok, true);
  const only = at(loadProgress().attempts, 0);
  assert.equal('timeline' in only, false);
  assert.equal(only.timeMs, 1200);
});

test('an export with a corrupt ghost still imports the run behind it', () => {
  const damaged = JSON.stringify({
    version: 1,
    attempts: [{ ...attempt('a', 1000), timeline: [{ key: 'f', ms: 'later' }] }],
  });
  assert.equal(importProgress(damaged).ok, true);
  const only = at(loadProgress().attempts, 0);
  assert.equal(only.timeline, undefined);
  assert.equal(only.exerciseId, 'a');
});

test('importing the same file twice does not double the history', () => {
  recordAttempt(attempt('a', 1000));
  const json = exportProgress();

  const first = importProgress(json);
  assert.equal(first.ok, true);
  const second = importProgress(json);
  assert.equal(second.ok, true);
  if (second.ok) assert.equal(second.merged, 0);
  assert.equal(loadProgress().attempts.length, 1);
});

test('import merges rather than replacing what is already there', () => {
  recordAttempt(attempt('laptop', 1000));
  const fromLaptop = exportProgress();

  store.removeItem(ATTEMPTS_KEY);
  recordAttempt(attempt('desktop', 2000));
  importProgress(fromLaptop);

  assert.deepEqual(
    loadProgress().attempts.map((a) => a.exerciseId),
    ['laptop', 'desktop'],
  );
});

test('bad input fails with a real message, never a silent no-op', () => {
  for (const bad of ['', '   ', 'not json at all', '[]', '{"version":1}']) {
    const result = importProgress(bad);
    assert.equal(result.ok, false, `expected ${JSON.stringify(bad)} to be rejected`);
    if (!result.ok) assert.ok(result.error.length > 20, 'error should be a sentence');
  }
});

test('an export from a future version is refused by name, not silently dropped', () => {
  const result = importProgress(JSON.stringify({ version: 99, attempts: [attempt('a', 1)] }));
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /version 99/);
});

test('loader discards an unknown version rather than throwing', () => {
  store.setItem(ATTEMPTS_KEY, JSON.stringify({ version: 99, attempts: [attempt('a', 1)] }));
  assert.deepEqual(loadProgress().attempts, []);
});

test('loader survives malformed JSON', () => {
  store.setItem(ATTEMPTS_KEY, '{not json');
  assert.deepEqual(loadProgress().attempts, []);
});

test('one corrupt record costs that record, not the whole history', () => {
  store.setItem(
    ATTEMPTS_KEY,
    JSON.stringify({ version: 1, attempts: [attempt('good', 1), { exerciseId: 'bad' }] }),
  );
  assert.deepEqual(
    loadProgress().attempts.map((a) => a.exerciseId),
    ['good'],
  );
});

test('a finish time outside what Date can hold costs that record', () => {
  for (const at of [1e300, MAX_TIME_VALUE + 1, 0, -5, Number.MAX_VALUE]) {
    assert.equal(parseAttempt(attempt('bad', at)), null, `at=${at} should be rejected`);
  }
  assert.notEqual(parseAttempt(attempt('edge', MAX_TIME_VALUE)), null);
  assert.notEqual(parseAttempt(attempt('now', 1_700_000_000_000)), null);

  const result = importProgress(
    JSON.stringify({ version: 1, attempts: [attempt('good', 1000), attempt('bad', 1e300)] }),
  );
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.imported, 1);
  assert.deepEqual(
    loadProgress().attempts.map((a) => a.exerciseId),
    ['good'],
  );
});

test('a record past the size caps costs that record', () => {
  const good = attempt('good', 1000);
  const over = [
    { ...good, exerciseId: 'x'.repeat(MAX_FIELD_LENGTH + 1) },
    { ...good, lessonSlug: 'x'.repeat(MAX_FIELD_LENGTH + 1) },
    { ...good, motions: Array.from({ length: MAX_MOTIONS + 1 }, () => 'w') },
    { ...good, motions: ['x'.repeat(MAX_FIELD_LENGTH + 1)] },
    { ...good, timeMs: MAX_COUNTER + 1 },
    { ...good, timeMs: MAX_ATTEMPT_MS + 1 },
    { ...good, keystrokes: 1e308 },
    { ...good, wastedKeys: MAX_COUNTER * 10 },
    { ...good, par: Number.MAX_SAFE_INTEGER },
  ];
  for (const [i, record] of over.entries()) {
    assert.equal(parseAttempt(record), null, `oversized record #${i} should be rejected`);
  }
  assert.notEqual(
    parseAttempt({
      ...good,
      exerciseId: 'x'.repeat(MAX_FIELD_LENGTH),
      motions: Array.from({ length: MAX_MOTIONS }, () => 'w'),
      timeMs: MAX_ATTEMPT_MS,
    }),
    null,
  );
});

test('an attempt longer than a day costs that record, so /stats can format it', () => {
  for (const timeMs of [1e308, MAX_COUNTER, MAX_ATTEMPT_MS + 1, -1]) {
    assert.equal(
      parseAttempt({ ...attempt('bad', 1000), timeMs }),
      null,
      `timeMs=${timeMs} should be rejected`,
    );
  }
  for (const timeMs of [MAX_ATTEMPT_MS, 0, 1200]) {
    assert.notEqual(parseAttempt({ ...attempt('ok', 1000), timeMs }), null);
  }

  const result = importProgress(
    JSON.stringify({
      version: 1,
      attempts: [attempt('good', 1000), { ...attempt('bad', 2000), timeMs: 1e308 }],
    }),
  );
  assert.equal(result.ok, true);
  assert.deepEqual(
    loadProgress().attempts.map((a) => a.exerciseId),
    ['good'],
  );
});

test('an import with more rows than the store ever holds is refused by count', () => {
  const rows = Array.from({ length: MAX_ATTEMPTS + 1 }, () => ({}));
  const result = importProgress(JSON.stringify({ version: 1, attempts: rows }));
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, new RegExp(`${MAX_ATTEMPTS + 1} attempts`));
  assert.equal(store.getItem(ATTEMPTS_KEY), null, 'nothing should have been written');

  const full = Array.from({ length: MAX_ATTEMPTS }, (_, i) => attempt(`a${i}`, i + 1));
  const ok = importProgress(JSON.stringify({ version: 1, attempts: full }));
  assert.equal(ok.ok, true);
  assert.equal(loadProgress().attempts.length, MAX_ATTEMPTS);
});

test('an import bigger than any export is refused by size, before it is parsed', () => {
  const padded = `{"version":1,"attempts":[],"pad":"${'x'.repeat(MAX_IMPORT_BYTES)}"}`;
  const result = importProgress(padded);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /MB/);
  assert.equal(store.getItem(ATTEMPTS_KEY), null);

  const full = Array.from({ length: MAX_ATTEMPTS }, (_, i) =>
    attempt(`some-long-exercise-id-${i}`, 1_700_000_000_000 + i),
  );
  store.setItem(ATTEMPTS_KEY, JSON.stringify({ version: 1, attempts: full }));
  const size = new TextEncoder().encode(exportProgress()).byteLength;
  assert.ok(size < MAX_IMPORT_BYTES / 2, `a full export is ${size} bytes; the cap is not close`);
});

test('the export filename carries the date it was made', () => {
  assert.equal(
    exportFilename(new Date('2026-09-01T10:00:00Z')),
    'vim-clay-progress-2026-09-01.json',
  );
});
