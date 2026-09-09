import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'insert-mode',
  title: 'Insert mode',
  module: 'basics',
  order: 4,
  keys: ['i', 'a', 'Esc'],
  summary: 'Two doors in, one door out.',
  language: 'text',
  explanation: [
    {
      heading: 'i goes before, a goes after',
      body:
        '[[i]] opens insert mode **before** the character under the cursor; [[a]] opens it ' +
        '**after**. That is the whole difference.',
    },
    {
      heading: 'a is the one that saves you a motion',
      body:
        'In normal mode the cursor cannot sit past the last character of a line, so `a` is ' +
        'the only way to type at the very end. Pair it with [[e]]: `e` lands on the final ' +
        'letter, `a` starts typing after it.',
    },
    {
      heading: 'One door out',
      body:
        '[[<Esc>]] always leaves insert mode. Press it the moment you stop typing — every ' +
        'command in the rest of this curriculum assumes normal mode.',
    },
  ],
  exercises: [
    {
      id: 'append-after',
      prompt: 'The word should be `true`. Add the missing letter and come back to normal mode.',
      startDoc: 'const ok = tru',
      startCursor: { line: 0, ch: 13 },
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: 'const ok = true' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'ae<Esc>',
      par: 3,
      hint: 'The cursor is on the `u`. You need to type *after* it, so `a`, not `i`.',
      motions: ['a', '<Esc>'],
    },
    {
      id: 'insert-before',
      prompt: 'The cursor is on `cat`. Put `black ` in front of it.',
      startDoc: 'the cat sat',
      startCursor: { line: 0, ch: 4 },
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: 'the black cat sat' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'iblack <Esc>',
      par: 8,
      hint: '`i` types before the cursor, so `cat` gets pushed along. Do not forget the space.',
      motions: ['i', '<Esc>'],
    },
    {
      id: 'append-to-argument',
      prompt: 'Make the call read `setStreak(streak + 1)`.',
      startDoc: 'setStreak(streak)',
      startCursor: { line: 0, ch: 10 },
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: 'setStreak(streak + 1)' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'ea + 1<Esc>',
      par: 7,
      hint: '`e` puts you on the `k` at the end of the argument; `a` starts typing just past it.',
      motions: ['e', 'a', '<Esc>'],
    },
  ],
};
