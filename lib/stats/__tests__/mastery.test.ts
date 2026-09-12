import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import type { AttemptRecord } from '@/lib/progress/schema.ts';
import { at } from '@/scripts/test-utils.ts';
import {
  MASTERY_WINDOW,
  UNPRACTISED_WEIGHT,
  motionAttemptCounts,
  motionMastery,
  scoreAttempt,
  weakestMotions,
  weaknessWeight,
} from '../mastery.ts';

let clock = 1_700_000_000_000;

function attempt(over: Partial<AttemptRecord> = {}): AttemptRecord {
  clock += 60_000;
  return {
    exerciseId: 'e1',
    lessonSlug: 'hjkl',
    motions: ['w'],
    timeMs: 4000,
    keystrokes: 4,
    wastedKeys: 0,
    par: 4,
    solved: true,
    at: clock,
    ...over,
  };
}

test('a flawless solve at par scores 100', () => {
  assert.equal(scoreAttempt(attempt({ par: 4, keystrokes: 4, wastedKeys: 0 })), 100);
});

test('an unsolved attempt scores 0 — giving up is evidence, not absence of evidence', () => {
  assert.equal(scoreAttempt(attempt({ solved: false })), 0);
});

test('the score is 0.6 efficiency plus 0.4 accuracy', () => {
  assert.equal(scoreAttempt(attempt({ par: 2, keystrokes: 4, wastedKeys: 1 })), 60);
});

test('spending more than 2x par is penalised by a multiplier, not zeroed', () => {
  const inBand = scoreAttempt(attempt({ par: 4, keystrokes: 8, wastedKeys: 0 }));
  const overBand = scoreAttempt(attempt({ par: 4, keystrokes: 9, wastedKeys: 0 }));
  assert.ok(overBand < inBand);
  assert.ok(overBand > 0);
});

test('mastery is a rolling mean over the last five attempts that used the motion', () => {
  const history = [
    attempt({ solved: false }),
    attempt(),
    attempt(),
    attempt(),
    attempt(),
    attempt(),
  ];
  assert.equal(motionMastery(history)['w'], 100);
});

test('the window is exactly five', () => {
  const history = [attempt({ solved: false }), attempt(), attempt(), attempt(), attempt()];
  assert.equal(history.length, MASTERY_WINDOW);
  assert.equal(motionMastery(history)['w'], 80);
});

test('an exercise contributes to every motion it lists', () => {
  const mastery = motionMastery([attempt({ motions: ['ci{', 'i', '{'] })]);
  assert.equal(mastery['ci{'], 100);
  assert.equal(mastery['i'], 100);
  assert.equal(mastery['{'], 100);
});

test('a motion with no attempts is null, never 0', () => {
  const mastery = motionMastery([attempt({ motions: ['w'] })], ['w', 'dap']);
  assert.equal(mastery['w'], 100);
  assert.equal(mastery['dap'], null);
  assert.ok('dap' in mastery);
});

test('mastery over an empty history is all nulls, not an empty object', () => {
  assert.deepEqual(motionMastery([], ['w', 'b']), { w: null, b: null });
});

test('weakness weight rises as mastery falls, and unpractised sits in between', () => {
  assert.equal(weaknessWeight(100), 1);
  assert.equal(weaknessWeight(0), 5);
  assert.equal(weaknessWeight(null), UNPRACTISED_WEIGHT);
  assert.ok(weaknessWeight(50) > weaknessWeight(75));
  assert.equal(weaknessWeight(200), 1);
});

test('weakest motions are worst first and exclude the never-practised', () => {
  const mastery = { w: 90, b: 20, e: 55, dap: null };
  const weakest = weakestMotions(mastery, { w: 3, b: 2, e: 1 }, 5);
  assert.deepEqual(
    weakest.map((m) => m.motion),
    ['b', 'e', 'w'],
  );
  assert.equal(at(weakest, 0).attempts, 2);
});

test('attempt counts tally every motion once per attempt', () => {
  const counts = motionAttemptCounts([
    attempt({ motions: ['w', 'w', 'b'] }),
    attempt({ motions: ['w'] }),
  ]);
  assert.equal(counts['w'], 2);
  assert.equal(counts['b'], 1);
});
