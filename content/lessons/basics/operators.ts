import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'operators',
  title: 'The operator grammar',
  module: 'basics',
  order: 12,
  keys: ['d', 'c', 'y'],
  summary: 'Verb plus motion. Learn the grammar once and every motion you know comes with it.',
  language: 'text',
  explanation: [
    {
      heading: 'd is a verb, and it waits',
      body:
        'Press [[d]] on its own and nothing happens: it is a verb with no object yet. Give it ' +
        'a motion and it deletes exactly what that motion would have crossed — [[dw]] a word, ' +
        '[[d$]] to the end of the line, [[dt,]] up to the next comma. One rule, applied to ' +
        'every motion you already know.',
    },
    {
      heading: 'Everything from the last ten lessons is now a noun',
      body:
        'That is why this module spent so long on moving around. `w e b W E B 0 ^ $ f t` are ' +
        'the vocabulary. Three verbs against a dozen nouns is thirty-six commands, none of them ' +
        'learned as a shortcut: you have never seen `y$`, but you know what it does.',
    },
    {
      heading: 'The other two verbs, and the doubling rule',
      body:
        '[[c]] is `d` that keeps typing: same deletion, but it leaves you in insert mode, so ' +
        '`ce` replaces a word in one move. [[y]] yanks — copies — and changes nothing. Doubling ' +
        'a verb takes the whole line: [[dd]], [[cc]], [[yy]]. A count goes in front of either ' +
        'half, so `3dw` and `d3w` both eat three words.',
    },
  ],
  exercises: [
    {
      id: 'delete-a-word',
      prompt: 'Delete the word `very`.',
      startDoc: 'a very fast editor',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'doc', expected: 'a fast editor' },
      solution: 'wdw',
      par: 3,
      hint: 'Hop onto `very` with `w`, then `dw`. The verb takes the word *and* the space after it.',
      motions: ['w', 'dw'],
    },
    {
      id: 'delete-to-end',
      prompt: 'Delete from the cursor to the end of the line.',
      startDoc: 'return total * rate * bonus;',
      startCursor: { line: 0, ch: 12 },
      goal: { type: 'doc', expected: 'return total' },
      solution: 'd$',
      par: 2,
      hint: 'You met `$` two lessons ago. It is a noun now: `d$`.',
      motions: ['d$'],
    },
    {
      id: 'change-a-word',
      prompt: 'Change `slow` to `fast`.',
      startDoc: 'a slow editor',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: 'a fast editor' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'wcefast<Esc>',
      par: 8,
      hint: '`ce` deletes to the end of the word and leaves you typing. Then `<Esc>` to come home.',
      motions: ['w', 'ce', '<Esc>'],
    },
    {
      id: 'yank-a-word',
      prompt:
        'Yank the word `habit` into the register. Nothing on screen will change — that is what copying looks like.',
      startDoc: 'const streak = habit.streak;',
      startCursor: { line: 0, ch: 15 },
      goal: { type: 'register', name: '"', expected: 'habit' },
      solution: 'yw',
      par: 2,
      hint: 'Same grammar, third verb: `y` plus the motion `w`. The `.` stops the word, so only `habit` is taken.',
      motions: ['yw'],
    },
  ],
};
