import assert from 'node:assert/strict';
import test from 'node:test';

import { parsePending, resolveHelp } from '../resolve';

test('an empty buffer parses to nothing pending', () => {
  const p = parsePending('');
  assert.deepEqual(p.atoms, []);
  assert.equal(p.count, null);
  assert.equal(p.charArgFor, null);
});

test('a bare operator is one atom', () => {
  assert.deepEqual(parsePending('d').atoms, ['d']);
  assert.deepEqual(parsePending('ci').atoms, ['c', 'i']);
  assert.deepEqual(parsePending('gU').atoms, ['g', 'U']);
});

test('a count before the operator is a count, not an atom', () => {
  const p = parsePending('2d');
  assert.deepEqual(p.atoms, ['d']);
  assert.equal(p.count, 2);
});

test('two counts multiply, because that is what vim does', () => {
  const p = parsePending('2d3');
  assert.deepEqual(p.atoms, ['d']);
  assert.equal(p.count, 6);
});

test('a leading zero is the first-column motion, not a count', () => {
  const p = parsePending('d0');
  assert.deepEqual(p.atoms, ['d', '0']);
  assert.equal(p.count, null);
});

test('a zero inside a count is part of the number', () => {
  assert.equal(parsePending('10').count, 10);
});

test('f swallows the next character, digits included', () => {
  const p = parsePending('f');
  assert.equal(p.charArgFor, 'f');
  const withTarget = parsePending('f3');
  assert.deepEqual(withTarget.atoms, ['f', '3']);
  assert.equal(withTarget.count, null, 'the 3 is f’s target, not a count');
});

test('a register prefix is peeled off the front', () => {
  const p = parsePending('"a2y');
  assert.equal(p.register, 'a');
  assert.equal(p.count, 2);
  assert.deepEqual(p.atoms, ['y']);
});

test('a lone double quote is a register still being chosen', () => {
  assert.equal(parsePending('"').registerPending, true);
});

test('normal mode with nothing pending offers the whole top level', () => {
  const view = resolveHelp('normal', '');
  assert.equal(view.unknown, false);
  assert.equal(view.typedLen, 0);
  const ids = view.groups.map((g) => g.id);
  assert.ok(ids.includes('move'));
  assert.ok(ids.includes('edit'));
  assert.ok(view.groups.length >= 5);
});

test('pressing d narrows to what d accepts, and to nothing else', () => {
  const view = resolveHelp('normal', 'd');
  assert.equal(view.unknown, false);
  assert.deepEqual(view.typed, ['d']);
  assert.equal(view.typedLen, 1);

  const rows = view.groups.flatMap((g) => g.entries.map((e) => e.keys.join('')));
  for (const expected of ['dd', 'dw', 'db', 'd$', 'di{', 'dap', 'd3j']) {
    assert.ok(rows.includes(expected), `expected the panel to offer ${expected}`);
  }
  for (const row of rows) assert.ok(row.startsWith('d'), `${row} does not follow d`);
});

test('pressing i after d narrows again to the text objects', () => {
  const view = resolveHelp('normal', 'di');
  assert.equal(view.typedLen, 2);
  const rows = view.groups.flatMap((g) => g.entries.map((e) => e.keys.join('')));
  assert.ok(rows.includes('di{'));
  assert.ok(rows.includes('di"'));
  assert.ok(!rows.some((r) => r.startsWith('da')), 'da rows belong to the `da` panel');
});

test('the descriptions carry the operator’s own verb', () => {
  const yank = resolveHelp('normal', 'y');
  const row = yank.groups.flatMap((g) => g.entries).find((e) => e.keys.join('') === 'yw');
  assert.ok(row !== undefined);
  assert.ok(row.what.startsWith('yank '), row.what);
});

test('a pending f asks for a character instead of guessing', () => {
  const view = resolveHelp('normal', 'df');
  assert.equal(view.groups.length, 0);
  assert.equal(view.unknown, false);
  assert.match(view.note ?? '', /character/i);
});

test('insert mode stays short and says how to get out', () => {
  const view = resolveHelp('insert', '');
  const rows = view.groups.flatMap((g) => g.entries.map((e) => e.keys.join('')));
  assert.equal(rows[0], '<Esc>');
  assert.ok(rows.length <= 4, 'insert mode must not be padded out');
});

test('visual mode offers actions on the selection, not operators waiting for a motion', () => {
  const view = resolveHelp('visual', '');
  const rows = view.groups.flatMap((g) => g.entries.map((e) => e.keys.join('')));
  assert.ok(rows.includes('d'));
  assert.ok(rows.includes('o'));
});

test('visual block mode surfaces the two keys it exists for', () => {
  const view = resolveHelp('visual-block', '');
  const act = view.groups.find((g) => g.id === 'act');
  assert.ok(act !== undefined);
  const first = act.entries.slice(0, 2).map((e) => e.keys.join(''));
  assert.deepEqual(first, ['I', 'A']);
});

test('a count on its own is reported so the panel can explain it', () => {
  const view = resolveHelp('normal', '3');
  assert.equal(view.count, 3);
  assert.equal(view.unknown, false);
});

test('something the panel cannot explain is admitted, never invented', () => {
  const view = resolveHelp('normal', 'Q');
  assert.equal(view.unknown, true);
  assert.equal(view.groups.length, 0);
  assert.match(view.note ?? '', /does not know/);
});
