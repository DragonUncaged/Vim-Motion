import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'counts',
  title: 'Counts',
  module: 'operators',
  order: 4,
  keys: ['3w', '2dd', 'd3w'],
  summary: 'A number in front means "do that this many times" — and counts multiply.',
  language: 'text',
  explanation: [
    {
      heading: 'Type the number first',
      body:
        'Every motion takes a count. [[3w]] is three words forward, [[5j]] five lines down, ' +
        '[[2f,]] the second comma rather than the first. It is an argument, not a repeat.',
    },
    {
      heading: 'Either side of the operator',
      body:
        'The count sits before the operator or before the motion, and two of them multiply: ' +
        '`2d3w` deletes six words. Put it wherever you thought of it.',
    },
    {
      heading: 'When not to bother',
      body:
        'Counting lines on screen is slower than a search or a text object. Use a count when ' +
        'the number is small and obvious; past about five, reach for something else.',
    },
  ],
  exercises: [
    {
      id: 'count-words',
      prompt: 'Land on `quartz` with one count instead of tapping [[w]] three times.',
      startDoc: 'sphinx of black quartz judge my vow',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursorOnText', text: 'quartz' },
      solution: '3w',
      par: 2,
      hint: 'Type the number, then the motion: [[3w]].',
      motions: ['w', '3w'],
    },
    {
      id: 'count-lines',
      prompt: 'Delete the three debug lines with a count on [[dd]].',
      startDoc:
        'export function Card() {\n  console.log("a");\n  console.log("b");\n  console.log("c");\n  return null;\n}',
      startCursor: { line: 1, ch: 2 },
      goal: { type: 'doc', expected: 'export function Card() {\n  return null;\n}' },
      solution: '3dd',
      par: 3,
      hint: 'The count goes in front of the operator: [[3dd]].',
      motions: ['dd', '3dd'],
    },
    {
      id: 'count-on-motion',
      prompt: 'Three `very`s is two too many. Delete the extra pair with the count on the motion.',
      startDoc: 'Vim is a very very very fast editor.',
      startCursor: { line: 0, ch: 0 },
      setupKeys: 'fv',
      goal: { type: 'doc', expected: 'Vim is a very fast editor.' },
      solution: 'd2w',
      par: 3,
      hint: 'The cursor is on the first `very`. [[d2w]] eats the next two words.',
      motions: ['dw', 'd2w'],
    },
  ],
};
