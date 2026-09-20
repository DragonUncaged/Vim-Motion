import type { Lesson } from '../../types';
import { storeGo } from './source';

export const lesson: Lesson = {
  slug: 'go-block',
  title: 'Bulk edit with block visual',
  module: 'go',
  order: 5,
  keys: ['C-v', 'I', 'A'],
  summary: 'One column, many lines. The move that makes people ask what you just did.',
  language: 'go',
  explanation: [
    {
      heading: 'A block is a rectangle',
      body:
        '[[v]] selects a run of text; [[<C-v>]] selects a **rectangle** — the same columns on ' +
        'every line you extend over. Gofmt lines struct fields up, so the columns are already ' +
        'there.',
    },
    {
      heading: 'I types down the left edge, A down the right',
      body:
        'With a block selected, [[I]] types at the **left** edge of every line and [[A]] at ' +
        'the **right**. The closing [[<Esc>]] is what copies your typing down the block, so it ' +
        'is not optional. Pair [[A]] with [[$]] to stretch the right edge to the end of each ' +
        'line, however ragged.',
    },
    {
      heading: 'One edit, repeated down a stack',
      body:
        'Struct tags, pointer stars, a `// ` in front of six lines. Any edit that is the same ' +
        'on every line of a stack is one block, not six trips with the arrow keys.',
    },
  ],
  exercises: [
    {
      id: 'pointer-fields',
      prompt: 'Make all four `Session` fields pointers by inserting a `*` down the type column.',
      startDoc: storeGo,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '14G0ww',
      goal: {
        type: 'all',
        goals: [
          {
            type: 'docContains',
            expected:
              '\tID        *string\n\tUserID    *string\n\tToken     *string\n\tExpiresAt *time.Time',
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: '<C-v>3jI*<Esc>',
      par: 6,
      hint: 'The cursor is on the type column already. [[<C-v>]], down three, [[I]], `*`, [[<Esc>]].',
      motions: ['C-v', 'I'],
    },
    {
      id: 'tag-every-field',
      prompt:
        '`Session` must never be serialised. Block-append a `json:"-"` struct tag — backticks ' +
        'and the space in front of them included — to all four fields at once.',
      startDoc: storeGo,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '14G0',
      goal: {
        type: 'all',
        goals: [
          {
            type: 'docContains',
            expected:
              '\tID        string `json:"-"`\n\tUserID    string `json:"-"`\n' +
              '\tToken     string `json:"-"`\n\tExpiresAt time.Time `json:"-"`',
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: '<C-v>3j$A `json:"-"`<Esc>',
      par: 17,
      hint: 'The four lines are different lengths, so reach for [[$]] before [[A]].',
      motions: ['C-v', 'A', '$'],
    },
    {
      id: 'optional-fields',
      prompt: '`ID` is always set; the other three are not. Give only those three pointer types.',
      startDoc: storeGo,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '14G0',
      goal: {
        type: 'all',
        goals: [
          {
            type: 'docContains',
            expected:
              '\tID        string\n\tUserID    *string\n\tToken     *string\n\tExpiresAt *time.Time',
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'jww<C-v>2jI*<Esc>',
      par: 9,
      hint: 'Start the block one line lower, on the type column. [[w]] twice gets you there.',
      motions: ['C-v', 'I', 'w'],
    },
  ],
};
