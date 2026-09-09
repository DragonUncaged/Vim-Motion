import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'small-edits',
  title: 'Small edits',
  module: 'basics',
  order: 7,
  keys: ['x', 'r', 's'],
  summary: 'Fix a typo without a round trip through insert mode.',
  language: 'text',
  explanation: [
    {
      heading: 'Three ways to deal with one character',
      body:
        '[[x]] deletes the character under the cursor. [[r]] followed by a character replaces ' +
        'it and leaves you in normal mode. [[s]] deletes it and drops you into insert mode so ' +
        'you can type a replacement of any length.',
    },
    {
      heading: 'r is the one people forget',
      body:
        'The obvious fix for a wrong character — insert, backspace, retype, escape — is four ' +
        'moves for a one-character problem. [[r]] is two keys and never leaves normal mode.',
    },
    {
      heading: 'Pick by how much you are typing',
      body:
        'Removing: [[x]]. Swapping for one other: [[r]]. Swapping for something longer, like ' +
        '`=` into `===`: [[s]]. Counts work on all three.',
    },
  ],
  exercises: [
    {
      id: 'doubled-letter',
      prompt: 'There is one `l` too many. Delete it.',
      startDoc: 'helllo',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'doc', expected: 'hello' },
      solution: 'llx',
      par: 3,
      hint: 'Move onto any of the `l`s, then `x`.',
      motions: ['x'],
    },
    {
      id: 'wrong-letter',
      prompt: 'Fix the typo: `vom` should read `vim`.',
      startDoc: 'vom motions',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'doc', expected: 'vim motions' },
      solution: 'lri',
      par: 3,
      hint: 'Step right onto the `o`, then `r` followed by the letter you want.',
      motions: ['r'],
    },
    {
      id: 'double-space',
      prompt: 'There are two spaces after `return`. Delete one.',
      startDoc: '  return  total;',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'doc', expected: '  return total;' },
      solution: 'elx',
      par: 3,
      hint: '`e` lands on the `n` at the end of `return`; one step right puts you on a space.',
      motions: ['e', 'x'],
    },
    {
      id: 'one-into-three',
      prompt: 'This comparison should be strict: turn the `=` into `===`.',
      startDoc: 'if (x = 1)',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: 'if (x === 1)' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: '3ws===<Esc>',
      par: 7,
      hint: 'Three words forward gets you to the `=`. `r` can only give you one character back, so use `s`.',
      motions: ['w', 's', '<Esc>'],
    },
  ],
};
