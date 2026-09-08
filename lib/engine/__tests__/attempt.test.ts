import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { computeMetrics, elapsedAt, idleClock, pauseAt, resumeAt, toTimeline } from '../attempt.ts';
import { MAX_TIMELINE_KEYS } from '@/lib/progress';
import { accuracy, efficiency, kpm } from '@/lib/stats/metrics.ts';

test('zero keystrokes: 100% efficient, fully accurate, no rate', () => {
  assert.deepEqual(computeMetrics(4, 0, 0, 0), { efficiency: 100, accuracy: 1, kpm: 0 });
  assert.deepEqual(computeMetrics(4, 0, 0, 2500), { efficiency: 100, accuracy: 1, kpm: 0 });
});

test('one keystroke on a one-key exercise: a real rate from a real time', () => {
  const m = computeMetrics(1, 1, 0, 6);
  assert.equal(m.efficiency, 100);
  assert.equal(m.accuracy, 1);
  assert.equal(m.kpm, kpm(1, 6));
  assert.equal(m.kpm, 10_000);
});

test('abandoned mid-operator: the operator alone is neither waste nor over par', () => {
  const m = computeMetrics(2, 1, 0, 800);
  assert.equal(m.efficiency, 100, 'min(par / keystrokes, 1) caps at 100');
  assert.equal(m.accuracy, 1);
  assert.equal(m.kpm, 75);
});

test('a count prefix costs efficiency, not accuracy', () => {
  const m = computeMetrics(2, 3, 0, 1500);
  assert.equal(m.efficiency, efficiency(2, 3));
  assert.ok(Math.abs(m.efficiency - 66.666) < 0.01);
  assert.equal(m.accuracy, 1);
  assert.equal(m.kpm, 120);
});

test('the edges where the two copies used to disagree', () => {
  assert.equal(computeMetrics(0, 3, 0, 1000).efficiency, 100);
  assert.equal(computeMetrics(0, 3, 0, 1000).efficiency, efficiency(0, 3));
  assert.equal(computeMetrics(5, 3, 5, 1000).accuracy, 0);
  assert.equal(computeMetrics(5, 3, 5, 1000).accuracy, accuracy(5, 3));
  assert.equal(computeMetrics(2, 2, 0, -5).kpm, 0);
});

test('a flawless attempt over par: efficiency drops, accuracy holds', () => {
  const m = computeMetrics(2, 6, 0, 3000);
  assert.ok(Math.abs(m.efficiency - 33.333) < 0.01);
  assert.equal(m.accuracy, 1);
  assert.equal(m.kpm, 120);
});

test('an untouched attempt has no clock at all', () => {
  const run = idleClock();
  assert.equal(elapsedAt(run, 1000), 0);
  assert.equal(resumeAt(run, 1000), null);
  assert.equal(elapsedAt(run, 5000), 0);
});

test('the clock stops where it is and resumes there', () => {
  const run = idleClock();
  run.startedAt = 1000;

  assert.equal(elapsedAt(run, 1600), 600, 'running: measured to now');

  pauseAt(run, 1600);
  assert.equal(elapsedAt(run, 1600), 600);
  assert.equal(elapsedAt(run, 9999), 600, 'paused: frozen however long the learner is gone');

  assert.equal(resumeAt(run, 9999), 1000 + 8399, 'the origin carries the whole away spell');
  assert.equal(elapsedAt(run, 9999), 600, 'and the reading is continuous across it');
  assert.equal(elapsedAt(run, 10_399), 1000, 'the clock runs again from where it stopped');
});

test('several away spells all come out of the total', () => {
  const run = idleClock();
  run.startedAt = 0;
  pauseAt(run, 500);
  resumeAt(run, 2500);
  pauseAt(run, 3000);
  resumeAt(run, 3100);
  assert.equal(elapsedAt(run, 3600), 1500);
  assert.equal(run.pausedMs, 2100);
});

test('pausing twice without resuming does not bank the same spell twice', () => {
  const run = idleClock();
  run.startedAt = 0;
  pauseAt(run, 1000);
  pauseAt(run, 4000);
  assert.equal(elapsedAt(run, 9000), 1000);
  resumeAt(run, 9000);
  assert.equal(elapsedAt(run, 9000), 1000);
});

test('resuming when never paused is a no-op, not a rewind', () => {
  const run = idleClock();
  run.startedAt = 0;
  assert.equal(resumeAt(run, 2000), 0, 'the origin is still the first keystroke');
  assert.equal(elapsedAt(run, 2000), 2000);
});

test('a clock that went backwards reads zero, never a negative time', () => {
  const run = idleClock();
  run.startedAt = 5000;
  assert.equal(elapsedAt(run, 4000), 0);
});

test('the timeline is the keys, on the attempt clock', () => {
  const keys = [
    { key: 'w', ms: 0 },
    { key: 'w', ms: 700 },
  ];
  assert.deepEqual(toTimeline(keys), keys);
  assert.notEqual(toTimeline(keys), keys, 'a copy: storage must not alias the live run');
  assert.equal(toTimeline([]), undefined, 'no keys is no ghost');
});

test('over the cap there is no timeline rather than a truncated one', () => {
  const under = Array.from({ length: MAX_TIMELINE_KEYS }, (_, i) => ({ key: 'x', ms: i }));
  assert.equal(toTimeline(under)?.length, MAX_TIMELINE_KEYS);
  assert.equal(toTimeline([...under, { key: 'x', ms: 1 }]), undefined);
});
