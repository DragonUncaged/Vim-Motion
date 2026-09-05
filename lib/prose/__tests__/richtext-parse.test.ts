import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseProse, splitKeyGroup } from '../richtext-parse.ts';

test('plain text passes through untouched', () => {
  assert.deepEqual(parseProse('Just words.'), [{ kind: 'text', value: 'Just words.' }]);
});

test('empty and non-string input yield no tokens', () => {
  assert.deepEqual(parseProse(''), []);
});

test('[[dw]] becomes two keycaps', () => {
  assert.deepEqual(parseProse('[[dw]]'), [{ kind: 'keys', keys: ['d', 'w'] }]);
});

test('[[<Esc>]] becomes one named keycap', () => {
  assert.deepEqual(parseProse('[[<Esc>]]'), [{ kind: 'keys', keys: ['Esc'] }]);
});

test('[[ci{]] becomes three keycaps', () => {
  assert.deepEqual(splitKeyGroup('ci{'), ['c', 'i', '{']);
});

test('[[3dd]] keeps the count as its own cap', () => {
  assert.deepEqual(splitKeyGroup('3dd'), ['3', 'd', 'd']);
});

test('[[<C-d>]] is a single control key', () => {
  assert.deepEqual(splitKeyGroup('<C-d>'), ['C-d']);
});

test('named keys mix with bare keys inside one group', () => {
  assert.deepEqual(splitKeyGroup('d<Esc>w'), ['d', 'Esc', 'w']);
});

test('unmatched [[ renders literally and does not throw', () => {
  assert.deepEqual(parseProse('press [[dw and stop'), [
    { kind: 'text', value: 'press [[dw and stop' },
  ]);
});

test('unmatched ]] renders literally', () => {
  assert.deepEqual(parseProse('a ]] b'), [{ kind: 'text', value: 'a ]] b' }]);
});

test('empty key group renders literally', () => {
  assert.deepEqual(parseProse('[[]]'), [{ kind: 'text', value: '[[]]' }]);
});

test('unterminated angle bracket is a literal character', () => {
  assert.deepEqual(splitKeyGroup('d<Esc'), ['d', '<', 'E', 's', 'c']);
});

test('inline code', () => {
  assert.deepEqual(parseProse('use `startDoc` here'), [
    { kind: 'text', value: 'use ' },
    { kind: 'code', value: 'startDoc' },
    { kind: 'text', value: ' here' },
  ]);
});

test('a lone backtick is literal', () => {
  assert.deepEqual(parseProse('a ` b'), [{ kind: 'text', value: 'a ` b' }]);
});

test('empty code span is literal', () => {
  assert.deepEqual(parseProse('a `` b'), [{ kind: 'text', value: 'a `` b' }]);
});

test('bold', () => {
  assert.deepEqual(parseProse('really **matters** here'), [
    { kind: 'text', value: 'really ' },
    { kind: 'bold', value: 'matters' },
    { kind: 'text', value: ' here' },
  ]);
});

test('a lone ** is literal', () => {
  assert.deepEqual(parseProse('2 ** 3'), [{ kind: 'text', value: '2 ** 3' }]);
});

test('all four constructs in one string', () => {
  assert.deepEqual(parseProse('Press [[<Esc>]], then `dw` is **two** keys: [[dw]].'), [
    { kind: 'text', value: 'Press ' },
    { kind: 'keys', keys: ['Esc'] },
    { kind: 'text', value: ', then ' },
    { kind: 'code', value: 'dw' },
    { kind: 'text', value: ' is ' },
    { kind: 'bold', value: 'two' },
    { kind: 'text', value: ' keys: ' },
    { kind: 'keys', keys: ['d', 'w'] },
    { kind: 'text', value: '.' },
  ]);
});

test('no HTML is ever interpreted', () => {
  assert.deepEqual(parseProse('<b>not bold</b>'), [{ kind: 'text', value: '<b>not bold</b>' }]);
});

test('nested-looking brackets do not throw', () => {
  assert.doesNotThrow(() => parseProse('[[[[dw]]]]'));
  assert.doesNotThrow(() => parseProse('[[a[[b]]'));
});

test('<lt> is the escape for a literal less-than (docs/CONTRACT.md §4 rule 4b)', () => {
  assert.deepEqual(splitKeyGroup('f<lt>'), ['f', '<']);
  assert.deepEqual(splitKeyGroup('ci<lt>'), ['c', 'i', '<']);
  assert.deepEqual(parseProse('[[f<lt>]]'), [{ kind: 'keys', keys: ['f', '<'] }]);
});

test('a literal greater-than needs no escape', () => {
  assert.deepEqual(splitKeyGroup('f>'), ['f', '>']);
});
