import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { ALL_CAPS, capForKey, capHeat, motionCaps, motionKeys } from '../keyboard.ts';
import { NO_VALUE, duration, fraction, longDuration, percent, rate } from '../format.ts';
import { get } from '@/scripts/test-utils.ts';

test('a motion splits into the keys it is typed with', () => {
  assert.deepEqual(motionKeys('dw'), ['d', 'w']);
  assert.deepEqual(motionKeys('ci{'), ['c', 'i', '{']);
  assert.deepEqual(motionKeys('d2j'), ['d', '2', 'j']);
});

test('a named key in angle brackets is one key', () => {
  assert.deepEqual(motionKeys('<Esc>'), ['Esc']);
  assert.deepEqual(motionKeys('ci<lt>'), ['c', 'i', '<']);
  assert.deepEqual(motionKeys('<C-d>'), ['C-d']);
});

test('an unterminated angle bracket degrades to a literal rather than eating the motion', () => {
  assert.deepEqual(motionKeys('f<'), ['f', '<']);
});

test('a shifted glyph maps to the cap the finger actually presses', () => {
  assert.equal(capForKey('{'), '[');
  assert.equal(capForKey('$'), '4');
  assert.equal(capForKey('W'), 'w');
  assert.equal(capForKey('Esc'), 'Esc');
  assert.equal(capForKey('C-d'), 'd');
});

test('a key the layout does not carry is null, not a crash', () => {
  assert.equal(capForKey('F13'), null);
});

test('motion caps are deduped and keep typing order', () => {
  assert.deepEqual(motionCaps('ci{'), ['c', 'i', '[']);
  assert.deepEqual(motionCaps('dd'), ['d']);
  assert.deepEqual(motionCaps('d$'), ['d', '4']);
});

test('every cap gets an entry, and untouched caps stay null rather than 0', () => {
  const heat = capHeat({ dw: 40, w: 80 });
  assert.equal(Object.keys(heat).length, ALL_CAPS.length);
  assert.equal(get(heat, 'w').mastery, 60);
  assert.equal(get(heat, 'd').mastery, 40);
  assert.equal(get(heat, 'z').mastery, null);
  assert.deepEqual(get(heat, 'z').motions, []);
});

test('a cap whose motions are all unpractised is null, not weak', () => {
  const heat = capHeat({ dap: null });
  assert.equal(get(heat, 'd').mastery, null);
  assert.deepEqual(get(heat, 'd').motions, [{ motion: 'dap', mastery: null }]);
});

test('a cap lists its motions strongest first with the unpractised last', () => {
  const heat = capHeat({ dw: 30, dd: 90, dap: null });
  assert.deepEqual(
    get(heat, 'd').motions.map((m) => m.motion),
    ['dd', 'dw', 'dap'],
  );
});

test('a first short session is reported in seconds, not rounded away to 0m', () => {
  assert.equal(longDuration(8_574), '9s');
  assert.equal(longDuration(400), '1s');
  assert.equal(longDuration(0), '0s');
  assert.equal(longDuration(90_000), '2m');
  assert.equal(longDuration(3_600_000), '1h');
  assert.equal(longDuration(3_900_000), '1h 5m');
});

test('no false precision: percentages and rates come back rounded', () => {
  assert.equal(percent(83.7142), '84%');
  assert.equal(fraction(0.9583), '96%');
  assert.equal(rate(84.4), '84');
  assert.equal(percent(null), NO_VALUE);
  assert.equal(duration(null), NO_VALUE);
  assert.equal(duration(2857), '2.9s');
  assert.equal(duration(420), '420ms');
});
