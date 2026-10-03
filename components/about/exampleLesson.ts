export const EXAMPLE_PATH = 'content/lessons/basics/join-lines.ts';

export const EXAMPLE_LESSON = `import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'join-lines',
  title: 'Joining lines',
  module: 'basics',
  order: 13,
  keys: ['J'],
  summary: 'One key for the thing you would otherwise do with four.',
  language: 'text',
  explanation: [
    {
      heading: 'J',
      body:
        '[[J]] pulls the next line up onto this one and leaves exactly one space between ' +
        'them, whatever the indentation was. It is the fix for a line that wrapped where ' +
        'you did not want it to.',
    },
    {
      heading: 'It takes a count',
      body:
        '[[3J]] joins three lines in one go. Counts work in front of almost every ' +
        'command in vim, and this is a good place to start noticing that.',
    },
  ],
  exercises: [
    {
      id: 'join-once',
      prompt: 'Pull the second line up onto the first.',
      startDoc: 'the quiet cheese\\nslept',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'doc', expected: 'the quiet cheese slept' },
      solution: 'J',
      par: 1,
      hint: 'One key, from anywhere on the first line.',
      motions: ['J'],
    },
    {
      id: 'join-three',
      prompt: 'Make all three lines into one.',
      startDoc: 'one\\ntwo\\nthree',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'doc', expected: 'one two three' },
      solution: '3J',
      par: 2,
      hint: 'Press \`J\` twice, or say how many lines you mean: \`3J\`.',
      motions: ['J'],
    },
  ],
};
`;

export const BARREL_PATH = 'content/lessons/basics/index.ts';

export const EXAMPLE_BARREL = `import { lesson as joinLines } from './join-lines';

export const lessons: Lesson[] = [
  // ...the lessons already there...
  operators,
  joinLines,
];
`;
