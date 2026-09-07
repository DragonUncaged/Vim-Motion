import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import type { AttemptRecord } from '@/lib/progress/schema.ts';
import {
  accuracy,
  efficiency,
  exceededPar,
  isCleanSolve,
  kpm,
  mean,
  median,
  streaks,
} from '../metrics.ts';

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

/* docs/CONTRACT.md §6 */

test('efficiency is min(par/keystrokes, 1) * 100 and caps at 100', () => {
  assert.equal(efficiency(2, 4), 50);
  assert.equal(efficiency(4, 4), 100);
  assert.equal(efficiency(8, 4), 100);
});

test('efficiency is 100 at zero keystrokes rather than NaN or Infinity', () => {
  assert.equal(efficiency(4, 0), 100);
});

test('accuracy is 1 - wasted/keystrokes, and 1 at zero keystrokes', () => {
  assert.equal(accuracy(0, 10), 1);
  assert.equal(accuracy(2, 10), 0.8);
  assert.equal(accuracy(0, 0), 1);
  assert.equal(accuracy(20, 10), 0);
});

test('kpm is keystrokes per minute, and 0 at zero elapsed time', () => {
  assert.equal(kpm(60, 60_000), 60);
  assert.equal(kpm(30, 30_000), 60);
  assert.equal(kpm(10, 0), 0);
});

test('exceeding 2x par is what breaks a clean solve', () => {
  assert.equal(exceededPar(attempt({ par: 4, keystrokes: 8 })), false);
  assert.equal(exceededPar(attempt({ par: 4, keystrokes: 9 })), true);
  assert.equal(isCleanSolve(attempt({ par: 4, keystrokes: 9 })), false);
  assert.equal(isCleanSolve(attempt({ solved: false })), false);
});

test('streaks count consecutive clean solves, current and best', () => {
  const history = [
    attempt(),
    attempt(),
    attempt({ solved: false }),
    attempt(),
    attempt(),
    attempt(),
  ];
  assert.deepEqual(streaks(history), { current: 3, best: 3 });
});

test('a streak is walked in chronological order, not storage order', () => {
  const first = attempt();
  const second = attempt();
  const failed = attempt({ solved: false, at: first.at + 1 });
  assert.deepEqual(streaks([second, first, failed]), { current: 1, best: 1 });
});

test('median and mean return null on an empty list rather than 0', () => {
  assert.equal(median([]), null);
  assert.equal(mean([]), null);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
});
