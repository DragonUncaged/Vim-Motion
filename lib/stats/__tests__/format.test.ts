import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { NO_VALUE, count, rate, shortDate } from '../format.ts';

test('shortDate formats a real time as day and short month', () => {
  // Noon UTC so the calendar day is the same in every zone the test might run in.
  assert.equal(shortDate(Date.UTC(2026, 7, 12, 12)), '12 Aug');
});

test('shortDate never throws on a time Date cannot hold', () => {
  for (const at of [1e300, 8.64e15 + 1, -8.64e15 - 1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(shortDate(at), NO_VALUE, `at=${at}`);
  }
});

test('rate groups thousands the same way count does', () => {
  assert.equal(rate(1905), count(1905));
  assert.equal(rate(1905), '1,905');
  assert.equal(rate(42.4), '42');
  assert.equal(rate(null), NO_VALUE);
  assert.equal(rate(Number.NaN), NO_VALUE);
});
