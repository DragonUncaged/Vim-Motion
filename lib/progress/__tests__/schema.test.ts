import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { at } from '@/scripts/test-utils.ts';
import {
  MAX_TIMELINE_KEYS,
  PROGRESS_VERSION,
  parseAttempt,
  parseProgressBlob,
  parseTimeline,
} from '../schema.ts';

const legacy = (over: Record<string, unknown> = {}) => ({
  exerciseId: 'hop',
  lessonSlug: 'find-char',
  motions: ['f'],
  timeMs: 2400,
  keystrokes: 3,
  wastedKeys: 0,
  par: 2,
  solved: true,
  at: 1_700_000_000_000,
  ...over,
});

const timeline = [
  { key: 'f', ms: 0 },
  { key: ',', ms: 180 },
  { key: 'x', ms: 410 },
];

describe('parseTimeline', () => {
  test('accepts a whole, ordered run', () => {
    assert.deepEqual(parseTimeline(timeline), timeline);
  });

  test('allows two keys inside the same millisecond', () => {
    const together = [
      { key: 'd', ms: 0 },
      { key: 'w', ms: 0 },
    ];
    assert.deepEqual(parseTimeline(together), together);
  });

  test('rejects anything that is not a whole run', () => {
    assert.equal(parseTimeline(undefined), undefined);
    assert.equal(parseTimeline(null), undefined);
    assert.equal(parseTimeline('f,w'), undefined);
    assert.equal(parseTimeline([]), undefined, 'an empty run is no run');
    assert.equal(parseTimeline([{ key: 'f' }]), undefined, 'missing offset');
    assert.equal(parseTimeline([{ ms: 0 }]), undefined, 'missing key');
    assert.equal(parseTimeline([{ key: '', ms: 0 }]), undefined, 'empty key');
    assert.equal(parseTimeline([{ key: 'f', ms: -1 }]), undefined, 'negative offset');
    assert.equal(parseTimeline([{ key: 'f', ms: Number.NaN }]), undefined, 'NaN offset');
    assert.equal(
      parseTimeline([{ key: 'f'.repeat(17), ms: 0 }]),
      undefined,
      'no vim key notation is that long',
    );
  });

  test('rejects offsets that run backwards, because the replay reads them in order', () => {
    assert.equal(
      parseTimeline([
        { key: 'f', ms: 200 },
        { key: 'w', ms: 100 },
      ]),
      undefined,
    );
  });

  test('drops an over-long run rather than truncating it to a ghost that stops dead', () => {
    const long = Array.from({ length: MAX_TIMELINE_KEYS + 1 }, (_, i) => ({ key: 'l', ms: i }));
    assert.equal(parseTimeline(long), undefined);
    assert.equal(parseTimeline(long.slice(0, MAX_TIMELINE_KEYS))?.length, MAX_TIMELINE_KEYS);
  });
});

describe('parseAttempt', () => {
  test('a record written before timelines existed loads untouched', () => {
    const before = legacy();
    const parsed = parseAttempt(before);
    assert.notEqual(parsed, null);
    assert.equal('timeline' in (parsed as object), false, 'no key is invented');
    assert.deepEqual(JSON.parse(JSON.stringify(parsed)), before, 're-serialises byte for byte');
  });

  test('a record with a timeline keeps it', () => {
    assert.deepEqual(parseAttempt(legacy({ timeline }))?.timeline, timeline);
  });

  test('a corrupt timeline costs the ghost, never the attempt', () => {
    const parsed = parseAttempt(legacy({ timeline: [{ key: 'f', ms: 'soon' }] }));
    assert.notEqual(parsed, null);
    assert.equal(parsed?.timeMs, 2400);
    assert.equal(parsed?.timeline, undefined);
  });
});

describe('parseProgressBlob', () => {
  test('mixes timeline-bearing and legacy records in one history', () => {
    const blob = parseProgressBlob({
      version: PROGRESS_VERSION,
      attempts: [legacy({ at: 1 }), legacy({ at: 2, timeline })],
    });
    const attempts = blob?.attempts ?? [];
    assert.equal(attempts.length, 2);
    assert.equal(at(attempts, 0).timeline, undefined);
    assert.deepEqual(at(attempts, 1).timeline, timeline);
  });
});
