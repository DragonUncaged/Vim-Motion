import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  exerciseWeakness,
  recencyFactor,
  sampleDrill,
  targetedMotions,
  RECENCY_FLOOR,
  RECENCY_WINDOW_MS,
} from '../sample.ts';
import { mulberry32 } from '../rng.ts';
import { personalBest, bestsByExercise, keysPlayed } from '../bests.ts';
import { parseDrillSegment, speedrunHref, drillHref } from '../route.ts';
import {
  isFindMotion,
  isJump,
  isOperator,
  isSearch,
  isTextObject,
  isWordMotion,
} from '../motions.ts';
import type { DrillItem } from '../types.ts';
import type { AttemptRecord } from '@/lib/progress/schema.ts';
import { at } from '@/scripts/test-utils.ts';

function item(id: string, lessonSlug: string, motions: string[]): DrillItem {
  return {
    key: `${lessonSlug}/${id}`,
    exerciseId: id,
    motions,
    lessonSlug,
    lessonTitle: lessonSlug,
    moduleId: 'basics',
    language: 'text',
  };
}

const NOW = 1_700_000_000_000;

describe('mulberry32', () => {
  it('is deterministic and stays inside [0, 1)', () => {
    const a = Array.from({ length: 20 }, mulberry32(42));
    const b = Array.from({ length: 20 }, mulberry32(42));
    assert.deepEqual(a, b);
    assert.ok(a.every((n) => n >= 0 && n < 1));
  });

  it('gives different streams for different seeds', () => {
    assert.notDeepEqual(
      Array.from({ length: 5 }, mulberry32(1)),
      Array.from({ length: 5 }, mulberry32(2)),
    );
  });
});

describe('exerciseWeakness', () => {
  it('weighs a motion you have nailed at 1 and one you cannot do at 5', () => {
    assert.equal(exerciseWeakness(item('a', 'l', ['w']), { w: 100 }), 1);
    assert.equal(exerciseWeakness(item('a', 'l', ['w']), { w: 0 }), 5);
  });

  it('gives a never-practised motion a moderate weight, not the worst one', () => {
    const unknown = exerciseWeakness(item('a', 'l', ['w']), { w: null });
    assert.ok(unknown > 1 && unknown < 5, `expected a middling weight, got ${unknown}`);
    assert.equal(unknown, 3);
  });

  it('treats a motion missing from the map as never practised', () => {
    assert.equal(exerciseWeakness(item('a', 'l', ['zz']), {}), 3);
  });

  it('takes the mean, so one weak motion among strong ones is not "your weakest"', () => {
    const mastery = { a: 0, b: 100, c: 100, d: 100 };
    const mixed = exerciseWeakness(item('x', 'l', ['a', 'b', 'c', 'd']), mastery);
    const pure = exerciseWeakness(item('y', 'l', ['a']), mastery);
    assert.ok(mixed < pure);
    assert.equal(mixed, 2);
  });
});

describe('recencyFactor', () => {
  it('is 1 for an exercise never seen', () => {
    assert.equal(recencyFactor('l/a', new Map(), NOW), 1);
  });

  it('bottoms out for one seen just now', () => {
    assert.equal(recencyFactor('l/a', new Map([['l/a', NOW]]), NOW), RECENCY_FLOOR);
  });

  it('is fully recovered once the window has passed', () => {
    const seen = new Map([['l/a', NOW - RECENCY_WINDOW_MS]]);
    assert.equal(recencyFactor('l/a', seen, NOW), 1);
  });

  it('does not exceed 1 for a clock that jumped backwards', () => {
    assert.equal(recencyFactor('l/a', new Map([['l/a', NOW + 60_000]]), NOW), RECENCY_FLOOR);
  });
});

describe('sampleDrill', () => {
  const pool = [
    item('a1', 'lesson-a', ['w']),
    item('a2', 'lesson-a', ['w']),
    item('b1', 'lesson-b', ['ci{']),
    item('b2', 'lesson-b', ['ci{']),
    item('c1', 'lesson-c', ['f']),
    item('c2', 'lesson-c', ['f']),
    item('d1', 'lesson-d', ['dap']),
    item('d2', 'lesson-d', ['dap']),
  ];
  const base = {
    items: pool,
    mastery: { w: 50, 'ci{': 50, f: 50, dap: 50 },
    lastSeen: new Map<string, number>(),
    now: NOW,
    count: 4,
    seed: 7,
  };

  it('is deterministic for a seed', () => {
    const one = sampleDrill(base).items.map((i) => i.key);
    const two = sampleDrill(base).items.map((i) => i.key);
    assert.deepEqual(one, two);
  });

  it('gives a different run for a different seed', () => {
    const seeds = [1, 2, 3, 4, 5].map((seed) =>
      sampleDrill({ ...base, seed })
        .items.map((i) => i.key)
        .join(','),
    );
    assert.ok(new Set(seeds).size > 1, 'every seed produced the same run');
  });

  it('never repeats an exercise inside one run', () => {
    for (let seed = 0; seed < 60; seed += 1) {
      const keys = sampleDrill({ ...base, seed, count: 8 }).items.map((i) => i.key);
      assert.equal(new Set(keys).size, keys.length, `seed ${seed} repeated an exercise`);
    }
  });

  it('asks for no more than the pool holds', () => {
    assert.equal(sampleDrill({ ...base, count: 50 }).items.length, pool.length);
    assert.equal(sampleDrill({ ...base, items: [], count: 10 }).items.length, 0);
  });

  it('surfaces the weak motion far more often than the mastered one', () => {
    const mastery = { w: 0, 'ci{': 100, f: 100, dap: 100 };
    let weak = 0;
    for (let seed = 0; seed < 400; seed += 1) {
      if (
        at(sampleDrill({ ...base, mastery, seed, count: 1 }).items, 0).lessonSlug === 'lesson-a'
      ) {
        weak += 1;
      }
    }
    assert.ok(weak > 200, `weak motion drawn only ${weak} times in 400`);
  });

  it('spreads a cold-start run instead of favouring a corner of the curriculum', () => {
    const cold = { w: null, 'ci{': null, f: null, dap: null };
    const seen = new Map<string, number>();
    for (let seed = 0; seed < 300; seed += 1) {
      const first = at(sampleDrill({ ...base, mastery: cold, seed, count: 1 }).items, 0);
      seen.set(first.key, (seen.get(first.key) ?? 0) + 1);
    }
    assert.equal(seen.size, pool.length, 'some exercises were never reachable');
    const counts = [...seen.values()];
    assert.ok(Math.min(...counts) > 300 / pool.length / 3, 'the draw was badly lopsided');
  });

  it('prefers what you have not seen recently, all else equal', () => {
    const lastSeen = new Map(pool.slice(0, 4).map((i) => [i.key, NOW]));
    let fresh = 0;
    for (let seed = 0; seed < 300; seed += 1) {
      if (at(sampleDrill({ ...base, lastSeen, seed, count: 1 }).items, 0).lessonSlug > 'lesson-b') {
        fresh += 1;
      }
    }
    assert.ok(fresh > 180, `only ${fresh} of 300 first picks were unseen exercises`);
  });

  it('damps lesson siblings so a run is not all one lesson', () => {
    let allOneLesson = 0;
    for (let seed = 0; seed < 200; seed += 1) {
      const run = sampleDrill({ ...base, seed, count: 2 }).items;
      if (at(run, 0).lessonSlug === at(run, 1).lessonSlug) allOneLesson += 1;
    }
    assert.ok(allOneLesson < 20, `${allOneLesson} of 200 pairs came from one lesson`);
  });

  it('sharpens with emphasis without reordering the preference', () => {
    const mastery = { w: 10, 'ci{': 90, f: 90, dap: 90 };
    const count = (emphasis: number) => {
      let weak = 0;
      for (let seed = 0; seed < 300; seed += 1) {
        if (
          at(sampleDrill({ ...base, mastery, emphasis, seed, count: 1 }).items, 0).lessonSlug ===
          'lesson-a'
        ) {
          weak += 1;
        }
      }
      return weak;
    };
    assert.ok(count(2) > count(1), 'emphasis did not sharpen the draw');
  });
});

describe('targetedMotions', () => {
  it('sorts weakest first and reports unknown mastery as undefined', () => {
    const run = [
      item('a', 'l', ['w']),
      item('b', 'l', ['ci{']),
      item('c', 'l', ['f']),
      item('d', 'l', ['w']),
    ];
    const out = targetedMotions(run, { w: 90, 'ci{': 10, f: null });
    assert.deepEqual(
      out.map((m) => m.motion),
      ['ci{', 'f', 'w'],
    );
    assert.equal(at(out, 1).mastery, undefined);
    assert.equal(at(out, 2).inRun, 2);
  });
});

function attempt(over: Partial<AttemptRecord>): AttemptRecord {
  return {
    exerciseId: 'hop',
    lessonSlug: 'find-char',
    motions: ['f'],
    timeMs: 4000,
    keystrokes: 4,
    wastedKeys: 0,
    par: 3,
    solved: true,
    at: NOW,
    ...over,
  };
}

describe('personalBest', () => {
  it('is null with no solved attempt', () => {
    assert.equal(personalBest([], 'find-char/hop'), null);
    assert.equal(personalBest([attempt({ solved: false })], 'find-char/hop'), null);
  });

  it('takes the fastest solve and counts the runs', () => {
    const best = personalBest(
      [
        attempt({ timeMs: 9000 }),
        attempt({ timeMs: 3200, keystrokes: 3 }),
        attempt({ timeMs: 5000 }),
        attempt({ timeMs: 1, solved: false }),
      ],
      'find-char/hop',
    );
    assert.equal(best?.timeMs, 3200);
    assert.equal(best?.keystrokes, 3);
    assert.equal(best?.runs, 3);
  });

  it('ignores another exercise entirely', () => {
    const best = personalBest([attempt({ exerciseId: 'other', timeMs: 10 })], 'find-char/hop');
    assert.equal(best, null);
  });

  it('agrees with the bulk map', () => {
    const attempts = [attempt({ timeMs: 9000 }), attempt({ timeMs: 3200 })];
    assert.equal(
      bestsByExercise(attempts).get('find-char/hop')?.timeMs,
      personalBest(attempts, 'find-char/hop')?.timeMs,
    );
  });

  it('carries the ghost of the run it picked, never of another one', () => {
    const timeline = [{ key: 'f', ms: 0 }];
    const attempts = [
      attempt({ timeMs: 9000, timeline: [{ key: 'w', ms: 0 }] }),
      attempt({ timeMs: 3200, timeline }),
      attempt({ timeMs: 5000 }),
    ];
    assert.deepEqual(personalBest(attempts, 'find-char/hop')?.timeline, timeline);
    assert.deepEqual(bestsByExercise(attempts).get('find-char/hop')?.timeline, timeline);
  });

  it('reports no ghost for a best recorded before timelines existed', () => {
    const attempts = [attempt({ timeMs: 3200 })];
    assert.equal(personalBest(attempts, 'find-char/hop')?.timeline, null);
    assert.equal(bestsByExercise(attempts).get('find-char/hop')?.timeline, null);
  });
});

describe('keysPlayed', () => {
  const timeline = [
    { key: 'd', ms: 0 },
    { key: 'w', ms: 240 },
    { key: '.', ms: 700 },
  ];

  it('plays a key the moment its offset is reached, and not before', () => {
    assert.equal(keysPlayed(timeline, -1), 0);
    assert.equal(keysPlayed(timeline, 0), 1, 'the first key lands at zero');
    assert.equal(keysPlayed(timeline, 239), 1);
    assert.equal(keysPlayed(timeline, 240), 2);
    assert.equal(keysPlayed(timeline, 699), 2);
  });

  it('stops at the end of the run rather than past it', () => {
    assert.equal(keysPlayed(timeline, 700), 3);
    assert.equal(keysPlayed(timeline, 60_000), 3);
  });

  it('has nothing to play with no ghost', () => {
    assert.equal(keysPlayed([], 5000), 0);
  });
});

describe('parseDrillSegment', () => {
  it('reads a category as a drill', () => {
    assert.deepEqual(parseDrillSegment('weakest'), { mode: 'drill', categoryId: 'weakest' });
  });

  it('reads a bare speedrun as "choose for me"', () => {
    assert.deepEqual(parseDrillSegment('speedrun'), { mode: 'speedrun', itemKey: null });
  });

  it('round-trips a specific exercise', () => {
    const href = speedrunHref('find-char/hop-to-cheese');
    const segment = href.slice('/practice/'.length);
    assert.deepEqual(parseDrillSegment(segment), {
      mode: 'speedrun',
      itemKey: 'find-char/hop-to-cheese',
    });
  });

  it('falls back rather than 404ing on a malformed tail', () => {
    assert.deepEqual(parseDrillSegment('speedrun.oops'), { mode: 'speedrun', itemKey: null });
    assert.deepEqual(parseDrillSegment('speedrun.oops.'), { mode: 'speedrun', itemKey: null });
  });

  it('builds a drill href', () => {
    assert.equal(drillHref('react-tsx'), '/practice/react-tsx');
  });
});

describe('motion groups', () => {
  it('classifies the shapes the curriculum actually writes', () => {
    for (const m of ['w', 'e', 'B', '3w', 'dw', 'ce', 'd2w', 'yw']) {
      assert.ok(isWordMotion(m), `${m} should be a word motion`);
    }
    for (const m of ['f', 'F', 't>', ';', ',', 'ct)', 'dt,', 'f<']) {
      assert.ok(isFindMotion(m), `${m} should be a find motion`);
    }
    for (const m of ['iw', 'ciw', 'ci{', 'dap', 'da{', 'vi[', 'ci"', 'ci<', 'ci(']) {
      assert.ok(isTextObject(m), `${m} should be a text object`);
    }
    for (const m of ['d', 'dd', 'D', 'd$', 'ciw', 'yy', 'p', 'P', '3dd', 'd%']) {
      assert.ok(isOperator(m), `${m} should be an operator`);
    }
    for (const m of ['/', '?', 'n', 'N', '*', '#']) {
      assert.ok(isSearch(m), `${m} should be a search motion`);
    }
    for (const m of ['gg', 'G', '{', '}', '%', '3j', '<C-d>', '<C-u>', '$', '0', '^']) {
      assert.ok(isJump(m), `${m} should be a jump`);
    }
  });

  it('does not mistake bare insert keys for text objects, or hjkl for jumps', () => {
    for (const m of ['i', 'a', 'I', 'A', 'o', 'O']) {
      assert.equal(isTextObject(m), false, `${m} is insert, not a text object`);
    }
    for (const m of ['j', 'k', 'h', 'l']) {
      assert.equal(isJump(m), false, `${m} is walking, not jumping`);
    }
    assert.equal(isOperator('w'), false);
    assert.equal(isWordMotion('W'), true);
  });
});
