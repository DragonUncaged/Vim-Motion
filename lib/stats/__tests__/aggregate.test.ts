import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import type { AttemptRecord } from '@/lib/progress/schema.ts';
import { SESSION_GAP_MS, sessions } from '../sessions.ts';
import { summarise } from '../summary.ts';
import { curriculumMotions, curriculumProgress, lessonsForMotion } from '../curriculum.ts';
import type { Lesson, Module } from '@/content/types.ts';
import { at } from '@/scripts/test-utils.ts';

const BASE = 1_700_000_000_000;

function attempt(over: Partial<AttemptRecord> = {}): AttemptRecord {
  return {
    exerciseId: 'e1',
    lessonSlug: 'hjkl',
    motions: ['w'],
    timeMs: 4000,
    keystrokes: 4,
    wastedKeys: 0,
    par: 4,
    solved: true,
    at: BASE,
    ...over,
  };
}

test('a gap longer than the session gap starts a new session', () => {
  const grouped = sessions([
    attempt({ at: BASE }),
    attempt({ at: BASE + 60_000 }),
    attempt({ at: BASE + 60_000 + SESSION_GAP_MS + 1 }),
  ]);
  assert.equal(grouped.length, 2);
  assert.equal(at(grouped, 0).attempts, 2);
  assert.equal(at(grouped, 1).attempts, 1);
});

test('sessions come back oldest first even when the history is stored out of order', () => {
  const grouped = sessions([attempt({ at: BASE + 10 * SESSION_GAP_MS }), attempt({ at: BASE })]);
  assert.equal(grouped.length, 2);
  assert.ok(at(grouped, 0).startedAt < at(grouped, 1).startedAt);
});

test('an empty history has no sessions rather than one empty one', () => {
  assert.deepEqual(sessions([]), []);
});

test('session kpm and accuracy are computed over the whole sitting', () => {
  const session = at(
    sessions([
      attempt({ at: BASE, keystrokes: 30, wastedKeys: 3, timeMs: 30_000 }),
      attempt({ at: BASE + 1000, keystrokes: 30, wastedKeys: 1, timeMs: 30_000 }),
    ]),
    0,
  );
  assert.equal(session.kpm, 60);
  assert.equal(session.accuracy, 1 - 4 / 60);
});

test('the summary of an empty history reports nulls, not zeroes', () => {
  const summary = summarise([]);
  assert.equal(summary.attempts, 0);
  assert.equal(summary.medianSolveMs, null);
  assert.equal(summary.avgEfficiency, null);
  assert.equal(summary.avgAccuracy, null);
  assert.equal(summary.kpm, null);
  assert.equal(summary.lastAttemptAt, null);
});

test('exercises solved counts distinct exercises, not attempts', () => {
  const summary = summarise([
    attempt({ exerciseId: 'a', at: BASE }),
    attempt({ exerciseId: 'a', at: BASE + 1 }),
    attempt({ exerciseId: 'b', at: BASE + 2 }),
    attempt({ exerciseId: 'c', at: BASE + 3, solved: false }),
  ]);
  assert.equal(summary.attempts, 4);
  assert.equal(summary.solvedAttempts, 3);
  assert.equal(summary.exercisesSolved, 2);
});

test('averages are taken over solved attempts only', () => {
  const summary = summarise([
    attempt({ par: 4, keystrokes: 4 }),
    attempt({ par: 4, keystrokes: 40, solved: false }),
  ]);
  assert.equal(summary.avgEfficiency, 100);
});

const modules: Module[] = [
  { id: 'basics', name: 'Basic Vim', order: 1, blurb: 'b', accent: 'blue' },
];

function lesson(slug: string, ids: string[], motions: string[]): Lesson {
  return {
    slug,
    title: slug,
    module: 'basics',
    order: 1,
    keys: ['w'],
    summary: 's',
    explanation: [],
    language: 'text',
    exercises: ids.map((id) => ({
      id,
      prompt: 'p',
      startDoc: 'x',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'mode', mode: 'normal' },
      solution: 'w',
      par: 1,
      motions,
    })),
  };
}

test('module completion counts exercises, so a long lesson weighs more', () => {
  const lessons = { basics: [lesson('one', ['a', 'b', 'c'], ['w']), lesson('two', ['d'], ['b'])] };
  const basics = at(curriculumProgress(modules, lessons, new Set(['one/a', 'one/b'])), 0);
  assert.equal(basics.exercises, 4);
  assert.equal(basics.solved, 2);
  assert.equal(basics.completion, 0.5);
  assert.equal(basics.lessonsComplete, 0);
  assert.equal(at(basics.lessons, 0).completion, 2 / 3);
});

test('a module with no lessons reports 0 rather than dividing by zero', () => {
  const basics = at(curriculumProgress(modules, {}, new Set()), 0);
  assert.equal(basics.completion, 0);
  assert.equal(basics.lessons.length, 0);
});

test('curriculum motions are deduped and lessons are found by motion', () => {
  const lessons = [lesson('one', ['a'], ['w', 'b']), lesson('two', ['d'], ['b'])];
  assert.deepEqual(curriculumMotions(lessons), ['b', 'w']);
  assert.deepEqual(
    lessonsForMotion(lessons, 'b').map((l) => l.slug),
    ['one', 'two'],
  );
});
