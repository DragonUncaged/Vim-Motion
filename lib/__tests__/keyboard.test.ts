import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SEQUENCE_GAP_MS,
  normalizeKeyName,
  sequenceDown,
  tokenizeKeyLabel,
  type RecentKey,
} from '../keyboard.ts';

test('a label splits into the keys that have to be pressed, named keys staying whole', () => {
  assert.deepEqual(tokenizeKeyLabel('dw'), ['d', 'w']);
  assert.deepEqual(tokenizeKeyLabel('ci('), ['c', 'i', '(']);
  assert.deepEqual(tokenizeKeyLabel('gg'), ['g', 'g']);
  assert.deepEqual(tokenizeKeyLabel('ciw<Esc>'), ['c', 'i', 'w', 'Esc']);
  assert.deepEqual(tokenizeKeyLabel('d<C-d>'), ['d', 'C-d']);
  for (const single of ['d', 'Esc', '<Esc>', 'Space', 'C-d', '<C-d>', 'CR', '<lt>', 'PageDown']) {
    assert.deepEqual(tokenizeKeyLabel(single), [normalizeKeyName(single)], single);
  }
});

const history = (...keys: [string, number][]): RecentKey[] =>
  keys.map(([key, at]) => ({ key, at }));
const holding =
  (...keys: string[]) =>
  (key: string) =>
    keys.includes(key);

test('a single key is exactly the held set — the buffer plays no part', () => {
  assert.equal(sequenceDown(['d'], [], holding('d')), true);
  assert.equal(sequenceDown(['d'], history(['x', 0]), holding('d')), true);
  assert.equal(sequenceDown(['d'], history(['d', 0]), holding()), false);
});

test('dw lights while w is down and d was the keydown just before it, inside the gap', () => {
  const dw = ['d', 'w'];
  assert.equal(sequenceDown(dw, history(['d', 100], ['w', 250]), holding('w')), true);
  assert.equal(sequenceDown(dw, history(['d', 100], ['w', 250]), holding()), false);
  assert.equal(
    sequenceDown(dw, history(['d', 100], ['w', 100 + SEQUENCE_GAP_MS + 1]), holding('w')),
    false,
  );
  assert.equal(
    sequenceDown(dw, history(['d', 100], ['w', 100 + SEQUENCE_GAP_MS]), holding('w')),
    true,
  );
  assert.equal(sequenceDown(dw, history(['d', 100], ['x', 150], ['w', 200]), holding('w')), false);
  assert.equal(sequenceDown(dw, history(['w', 100], ['d', 200]), holding('d')), false);
  assert.equal(sequenceDown(dw, history(['w', 100]), holding('w')), false);
});

test('every gap in a longer sequence is measured, not just the last one', () => {
  const ciw = ['c', 'i', 'w'];
  assert.equal(sequenceDown(ciw, history(['c', 0], ['i', 200], ['w', 400]), holding('w')), true);
  assert.equal(
    sequenceDown(
      ciw,
      history(['c', 0], ['i', SEQUENCE_GAP_MS + 50], ['w', SEQUENCE_GAP_MS + 100]),
      holding('w'),
    ),
    false,
  );
  assert.equal(
    sequenceDown(
      ciw,
      history(['q', 0], ['q', 1], ['c', 500], ['i', 600], ['w', 700]),
      holding('w'),
    ),
    true,
  );
});
