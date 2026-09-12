import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'delete',
  title: 'Delete',
  module: 'operators',
  order: 1,
  keys: ['dw', 'dd', 'D', 'd2j'],
  summary: 'd is a verb. It waits for a motion and eats everything that motion covers.',
  language: 'text',
  explanation: [
    {
      heading: 'Verb plus motion',
      body:
        '[[d]] on its own waits. Give it a motion and it deletes what that motion would have ' +
        'crossed: [[dw]] a word, [[d$]] to the end of the line, [[df,]] up to and including ' +
        'the next comma.',
    },
    {
      heading: 'Doubling means the line',
      body:
        'Type the operator twice and it takes the whole line: [[dd]] this line, [[d2j]] this ' +
        'one and the two below. [[D]] is shorthand for `d$`.',
    },
    {
      heading: 'Why this is the whole editor',
      body:
        'This is **the grammar**, not a delete command. The next lesson swaps `d` for `c` and ' +
        'every combination still works. Ten motions and four operators is forty commands you ' +
        'never memorised.',
    },
  ],
  exercises: [
    {
      id: 'delete-word',
      prompt: 'Delete the word `very` — leave the rest of the line alone.',
      startDoc: 'a very fast editor',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'doc', expected: 'a fast editor' },
      solution: 'wdw',
      par: 3,
      hint: 'Hop onto it with [[w]] first, then [[dw]].',
      motions: ['w', 'dw'],
    },
    {
      id: 'delete-line',
      prompt: 'Delete the second line entirely.',
      startDoc: 'keep me\ndelete me\nkeep me too',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'doc', expected: 'keep me\nkeep me too' },
      solution: 'jdd',
      par: 3,
      hint: 'Get onto the line, then double the operator: [[dd]].',
      motions: ['j', 'dd'],
    },
    {
      id: 'delete-to-eol',
      prompt: 'Everything after `editor` is filler. Cut it with [[D]].',
      startDoc: 'Vim is a text editor and this half of the line is filler.',
      startCursor: { line: 0, ch: 20 },
      goal: { type: 'doc', expected: 'Vim is a text editor' },
      solution: 'D',
      par: 1,
      hint: 'The cursor is already parked on the space. [[D]] takes the rest.',
      motions: ['D'],
    },
    {
      id: 'delete-three-lines',
      prompt: 'Delete the three debug lines in one command, without pressing [[dd]] three times.',
      startDoc:
        'export function Card() {\n  console.log("a");\n  console.log("b");\n  console.log("c");\n  return null;\n}',
      startCursor: { line: 1, ch: 2 },
      goal: {
        type: 'doc',
        expected: 'export function Card() {\n  return null;\n}',
      },
      solution: 'd2j',
      par: 3,
      hint: '[[d2j]] — this line plus the two the motion crosses.',
      motions: ['d2j', 'dj'],
    },
  ],
};
