import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeWindow } from './fake-storage.ts';
import { at } from '@/scripts/test-utils.ts';

const { store, deny, fireStorageEvent } = installFakeWindow();

const {
  loadProgress,
  saveProgress,
  recordAttempt,
  clearProgress,
  storageAvailable,
  subscribeProgress,
} = await import('../storage.ts');
const { ATTEMPTS_KEY, MAX_ATTEMPTS } = await import('../schema.ts');
const { personalBest } = await import('@/lib/drills/bests.ts');

import type { AttemptRecord, GhostKey } from '../schema.ts';

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

const many = (n: number) => Array.from({ length: n }, (_, i) => attempt(`a${i}`, i + 1));

beforeEach(() => {
  store.reset();
  deny(false);
});

test('a full quota keeps the newest half', () => {
  const blob = { version: 1 as const, attempts: many(1000) };
  store.limit = JSON.stringify(blob).length - 1;

  assert.equal(saveProgress(blob), true);
  const kept = loadProgress().attempts;
  assert.equal(kept.length, 500);
  assert.equal(at(kept, 0).exerciseId, 'a500', 'the oldest half is what goes');
  assert.equal(at(kept, 499).exerciseId, 'a999');
  assert.deepEqual(store.writes, [ATTEMPTS_KEY, ATTEMPTS_KEY]);
});

test('at exactly quota the halving still runs, because nothing probes first', () => {
  const history = { version: 1 as const, attempts: many(1000) };
  const stored = JSON.stringify(history);
  store.setItem(ATTEMPTS_KEY, stored);
  store.setItem('vimclay:v1:filler', 'x'.repeat(200));
  store.limit = store.usage;
  store.writes = [];

  assert.equal(storageAvailable(), false, 'a probe write cannot fit');
  assert.equal(recordAttempt(attempt('new', 1001)), true);

  const kept = loadProgress().attempts;
  assert.equal(kept.length, 501);
  assert.equal(at(kept, 500).exerciseId, 'new', 'the attempt that triggered the save survived');
  assert.ok(
    store.writes.filter((k) => k !== '__vimclay_probe__').length >= 2,
    'the real key was written, not just a probe',
  );
});

test('storage that refuses every write reports failure instead of throwing', () => {
  store.failWrites = true;
  assert.equal(saveProgress({ version: 1, attempts: [attempt('a', 1)] }), false);
  assert.equal(recordAttempt(attempt('b', 2)), false);
  assert.deepEqual(store.writes, [ATTEMPTS_KEY, ATTEMPTS_KEY, ATTEMPTS_KEY, ATTEMPTS_KEY]);
});

test('more than MAX_ATTEMPTS keeps the newest MAX_ATTEMPTS', () => {
  assert.equal(saveProgress({ version: 1, attempts: many(MAX_ATTEMPTS + 1) }), true);
  const kept = loadProgress().attempts;
  assert.equal(kept.length, MAX_ATTEMPTS);
  assert.equal(at(kept, 0).exerciseId, 'a1', 'a0 is the one that goes');
  assert.equal(at(kept, MAX_ATTEMPTS - 1).exerciseId, `a${MAX_ATTEMPTS}`);
});

test('a browser that refuses storage reads as no progress, and every write says so', () => {
  store.setItem(ATTEMPTS_KEY, JSON.stringify({ version: 1, attempts: [attempt('a', 1)] }));
  deny(true);

  assert.deepEqual(loadProgress().attempts, [], 'what cannot be read is not there');
  assert.equal(saveProgress({ version: 1, attempts: [attempt('b', 2)] }), false);
  assert.equal(recordAttempt(attempt('c', 3)), false);
  assert.equal(clearProgress(), false);
  assert.equal(storageAvailable(), false);

  deny(false);
  assert.equal(loadProgress().attempts.length, 1, 'nothing was destroyed by the denial');
});

test('storageAvailable sees a store that throws on write, and leaves no key behind', () => {
  assert.equal(storageAvailable(), true);
  assert.equal(store.getItem('__vimclay_probe__'), null);
  store.failWrites = true;
  assert.equal(storageAvailable(), false);
});

test('a write in this tab and a write from another tab both reach subscribers', () => {
  let calls = 0;
  const unsubscribe = subscribeProgress(() => {
    calls += 1;
  });

  recordAttempt(attempt('a', 1));
  assert.equal(calls, 1, 'localStorage fires no event in the writing tab; notify() must');

  fireStorageEvent(ATTEMPTS_KEY);
  assert.equal(calls, 2, 'the other tab wrote our key');
  fireStorageEvent('vimclay:v1:theme');
  assert.equal(calls, 2, 'the other tab wrote a key that is not progress');
  fireStorageEvent(null);
  assert.equal(calls, 3, 'the other tab cleared site data');

  unsubscribe();
  recordAttempt(attempt('b', 2));
  fireStorageEvent(ATTEMPTS_KEY);
  assert.equal(calls, 3, 'nothing after unsubscribe');
});

const ghost = (label: string): GhostKey[] => [
  { key: label, ms: 0 },
  { key: 'w', ms: 120 },
];

let finishedAt = 0;
const run = (timeMs: number, timeline?: GhostKey[], over: Partial<AttemptRecord> = {}) => ({
  ...attempt('hop', (finishedAt += 1000)),
  lessonSlug: 'find-char',
  timeMs,
  ...(timeline === undefined ? {} : { timeline }),
  ...over,
});

const timelines = () => loadProgress().attempts.map((a) => a.timeline?.[0]?.key ?? null);

test('the first solved run keeps its keys — it is the ghost', () => {
  recordAttempt(run(2000, ghost('a')));
  assert.deepEqual(timelines(), ['a']);
});

test('a slower run keeps none, because it can never be the ghost', () => {
  recordAttempt(run(2000, ghost('a')));
  recordAttempt(run(3000, ghost('b')));
  assert.deepEqual(timelines(), ['a', null]);
});

test('a matching time keeps none either — the earlier run still holds the record', () => {
  recordAttempt(run(2000, ghost('a')));
  recordAttempt(run(2000, ghost('b')));
  assert.deepEqual(timelines(), ['a', null]);
});

test('a new best keeps its keys and prunes the run it superseded', () => {
  recordAttempt(run(2000, ghost('a')));
  recordAttempt(run(1500, ghost('b')));
  assert.deepEqual(timelines(), [null, 'b'], 'one timeline per exercise, and it is the best');
});

test('an unsolved run keeps none, however fast it ended', () => {
  recordAttempt(run(2000, ghost('a')));
  recordAttempt(run(10, ghost('b'), { solved: false }));
  assert.deepEqual(timelines(), ['a', null]);
});

test('a zero-length solve keeps none — that is a broken clock, not a record', () => {
  recordAttempt(run(0, ghost('a')));
  assert.deepEqual(timelines(), [null]);
});

test('pruning is per exercise, so one ghost never evicts another', () => {
  recordAttempt(run(2000, ghost('a')));
  recordAttempt(run(1500, ghost('b'), { exerciseId: 'skip', lessonSlug: 'words' }));
  recordAttempt(run(1000, ghost('c')));
  assert.deepEqual(timelines(), [null, 'b', 'c']);
});

test('a run offered with no keys is stored exactly as it arrived', () => {
  recordAttempt(run(2000));
  assert.equal('timeline' in at(loadProgress().attempts, 0), false);
});

test('the bar and the replay always come off one record', () => {
  for (const ms of [2000, 2500, 1800, 1900, 1200, 1300]) recordAttempt(run(ms, ghost(String(ms))));
  const stored = loadProgress().attempts;
  const best = personalBest(stored, 'find-char/hop');
  assert.equal(best?.timeMs, 1200);
  assert.equal(at(best?.timeline ?? [], 0).key, '1200', 'the ghost is the run the bar measures');
  assert.equal(stored.filter((a) => a.timeline !== undefined).length, 1);
});
