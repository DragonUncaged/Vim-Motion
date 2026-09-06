import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import type { Goal } from '@/content/types.ts';
import { evaluateGoal } from '../goal.ts';
import type { EditorSnapshot } from '../types.ts';

const DOC = 'const total = 1;\nconst rate = 2;\nreturn total * rate;';

function snap(over: Partial<EditorSnapshot> = {}): EditorSnapshot {
  return {
    doc: DOC,
    cursor: { line: 0, ch: 0 },
    selection: null,
    mode: 'normal',
    pendingKeys: '',
    registers: {},
    ...over,
  };
}

describe('evaluateGoal — cursor', () => {
  it('matches an exact position', () => {
    assert.equal(
      evaluateGoal({ type: 'cursor', line: 1, ch: 6 }, snap({ cursor: { line: 1, ch: 6 } })),
      true,
    );
  });

  it('rejects the right line at the wrong column', () => {
    assert.equal(
      evaluateGoal({ type: 'cursor', line: 1, ch: 6 }, snap({ cursor: { line: 1, ch: 7 } })),
      false,
    );
  });
});

describe('evaluateGoal — document', () => {
  it('doc is exact, not a prefix', () => {
    assert.equal(evaluateGoal({ type: 'doc', expected: DOC }, snap()), true);
    assert.equal(evaluateGoal({ type: 'doc', expected: DOC + '\n' }, snap()), false);
  });

  it('docContains and docExcludes are complements', () => {
    const inside: Goal = { type: 'docContains', expected: 'const rate' };
    const outside: Goal = { type: 'docExcludes', expected: 'const rate' };
    assert.equal(evaluateGoal(inside, snap()), true);
    assert.equal(evaluateGoal(outside, snap()), false);
    assert.equal(evaluateGoal(outside, snap({ doc: 'nothing here' })), true);
  });
});

describe('evaluateGoal — cursorOnText', () => {
  const goal = (occurrence?: number): Goal => ({ type: 'cursorOnText', text: 'total', occurrence });

  it('accepts any column inside the match', () => {
    for (let ch = 6; ch <= 10; ch++) {
      assert.equal(evaluateGoal(goal(), snap({ cursor: { line: 0, ch } })), true, `ch ${ch}`);
    }
  });

  it('rejects the character just past the match', () => {
    assert.equal(evaluateGoal(goal(), snap({ cursor: { line: 0, ch: 11 } })), false);
    assert.equal(evaluateGoal(goal(), snap({ cursor: { line: 0, ch: 5 } })), false);
  });

  it('counts occurrences from zero and across lines', () => {
    assert.equal(evaluateGoal(goal(1), snap({ cursor: { line: 2, ch: 7 } })), true);
    assert.equal(evaluateGoal(goal(1), snap({ cursor: { line: 0, ch: 6 } })), false);
  });

  it('is false when the text is not in the buffer at all', () => {
    assert.equal(evaluateGoal({ type: 'cursorOnText', text: 'absent' }, snap()), false);
  });
});

describe('evaluateGoal — selection', () => {
  const goal: Goal = { type: 'selection', from: { line: 0, ch: 0 }, to: { line: 0, ch: 5 } };

  it('needs a selection at all', () => {
    assert.equal(evaluateGoal(goal, snap({ selection: null })), false);
  });

  it('matches both ends exactly', () => {
    assert.equal(
      evaluateGoal(goal, snap({ selection: { from: { line: 0, ch: 0 }, to: { line: 0, ch: 5 } } })),
      true,
    );
    assert.equal(
      evaluateGoal(goal, snap({ selection: { from: { line: 0, ch: 0 }, to: { line: 0, ch: 6 } } })),
      false,
    );
  });
});

describe('evaluateGoal — register', () => {
  it('reads the unnamed register under both spellings', () => {
    const s = snap({ registers: { '"': 'const ' } });
    assert.equal(evaluateGoal({ type: 'register', name: '"', expected: 'const ' }, s), true);
    assert.equal(evaluateGoal({ type: 'register', name: '', expected: 'const ' }, s), true);
  });

  it('treats a missing register as empty rather than throwing', () => {
    assert.equal(evaluateGoal({ type: 'register', name: 'z', expected: '' }, snap()), true);
    assert.equal(evaluateGoal({ type: 'register', name: 'z', expected: 'x' }, snap()), false);
  });
});

describe('evaluateGoal — mode', () => {
  it('distinguishes the three visual sub-modes', () => {
    assert.equal(
      evaluateGoal({ type: 'mode', mode: 'visual' }, snap({ mode: 'visual-line' })),
      false,
    );
    assert.equal(
      evaluateGoal({ type: 'mode', mode: 'visual-line' }, snap({ mode: 'visual-line' })),
      true,
    );
  });
});

describe('evaluateGoal — all', () => {
  it('requires every sub-goal', () => {
    const goal: Goal = {
      type: 'all',
      goals: [
        { type: 'docContains', expected: 'const rate' },
        { type: 'mode', mode: 'normal' },
      ],
    };
    assert.equal(evaluateGoal(goal, snap()), true);
    assert.equal(evaluateGoal(goal, snap({ mode: 'insert' })), false);
  });

  it('nests', () => {
    const goal: Goal = {
      type: 'all',
      goals: [{ type: 'all', goals: [{ type: 'cursor', line: 0, ch: 0 }] }],
    };
    assert.equal(evaluateGoal(goal, snap()), true);
  });

  it('an empty `all` never passes — it is an authoring mistake, not a free solve', () => {
    assert.equal(evaluateGoal({ type: 'all', goals: [] }, snap()), false);
  });
});

describe('evaluateGoal — outcome validation', () => {
  it('passes for two different key routes that reach the same state', () => {
    const goal: Goal = { type: 'doc', expected: 'total = 1;' };
    const afterDw = snap({ doc: 'total = 1;' });
    const afterVex = snap({ doc: 'total = 1;', mode: 'normal', pendingKeys: '' });
    assert.equal(evaluateGoal(goal, afterDw), true);
    assert.equal(evaluateGoal(goal, afterVex), true);
  });
});
