/** Never looks at the learner's keys: a goal is decided from the outcome alone (docs/CONTRACT.md §4, rule 1). */

import type { Goal, Pos } from '@/content/types';
import type { EditorSnapshot } from './types';
import { nthIndexOf, offsetToPos, posToOffset } from './text';

const samePos = (a: Pos, b: Pos): boolean => a.line === b.line && a.ch === b.ch;

const registerKey = (name: string): string => (name === '' ? '"' : name);

export function evaluateGoal(goal: Goal, s: EditorSnapshot): boolean {
  switch (goal.type) {
    case 'cursor':
      return s.cursor.line === goal.line && s.cursor.ch === goal.ch;

    case 'doc':
      return s.doc === goal.expected;

    case 'docContains':
      return s.doc.includes(goal.expected);

    case 'docExcludes':
      return !s.doc.includes(goal.expected);

    case 'cursorOnText': {
      // The block cursor sits ON a character, so the last position that counts is the match's final character.
      const at = nthIndexOf(s.doc, goal.text, goal.occurrence ?? 0);
      if (at === -1) return false;
      const cursor = posToOffset(s.doc, s.cursor);
      return cursor >= at && cursor < at + goal.text.length;
    }

    case 'selection': {
      if (s.selection === null) return false;
      return samePos(s.selection.from, goal.from) && samePos(s.selection.to, goal.to);
    }

    case 'register':
      return (s.registers[registerKey(goal.name)] ?? '') === goal.expected;

    case 'mode':
      return s.mode === goal.mode;

    case 'all':
      // An empty `all` would be vacuously true and auto-solve; it is always an authoring mistake.
      return goal.goals.length > 0 && goal.goals.every((g) => evaluateGoal(g, s));

    default: {
      const exhaustive: never = goal;
      return exhaustive;
    }
  }
}

export function describeGoal(goal: Goal): string {
  switch (goal.type) {
    case 'cursor':
      return `cursor at line ${goal.line + 1}, column ${goal.ch + 1}`;
    case 'doc':
      return 'the buffer matches exactly';
    case 'docContains':
      return `the buffer contains ${JSON.stringify(goal.expected)}`;
    case 'docExcludes':
      return `the buffer no longer contains ${JSON.stringify(goal.expected)}`;
    case 'cursorOnText':
      return `cursor on ${JSON.stringify(goal.text)}`;
    case 'selection':
      return `selection from line ${goal.from.line + 1} to line ${goal.to.line + 1}`;
    case 'register':
      return `register ${goal.name} holds ${JSON.stringify(goal.expected)}`;
    case 'mode':
      return `editor in ${goal.mode} mode`;
    case 'all':
      return goal.goals.map(describeGoal).join(', and ');
    default: {
      const exhaustive: never = goal;
      return exhaustive;
    }
  }
}

export { offsetToPos, posToOffset };
