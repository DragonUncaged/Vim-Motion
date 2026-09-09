import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'big-words',
  title: 'WORDs',
  module: 'basics',
  order: 8,
  keys: ['W', 'E', 'B'],
  summary: 'Whitespace-separated bites. `foo.bar()` is three words but one WORD.',
  language: 'text',
  explanation: [
    {
      heading: 'Same three motions, bigger bite',
      body:
        '[[W]], [[E]] and [[B]] do exactly what [[w]], [[e]] and [[b]] do, but over **WORDs**: ' +
        'anything separated by whitespace, punctuation included. `handleChange(event.target.value)` ' +
        'is nine words and one WORD.',
    },
    {
      heading: 'Why code needs this',
      body:
        'Code is dots, parens, arrows and colons, and lowercase `w` stops at every one. ' +
        'Crossing `obj.items[0].name` costs seven `w` presses and one `W`.',
    },
    {
      heading: 'Which one to reach for',
      body:
        'Use [[W]] to cross a line — arguments, chained calls, qualified names. Use [[w]] for ' +
        'a piece **inside** one of those, like the `name` in `obj.name`.',
    },
  ],
  exercises: [
    {
      id: 'one-jump',
      prompt: 'Reach `props` in a single hop.',
      startDoc: 'handleChange(event.target.value) props',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursorOnText', text: 'props' },
      solution: 'W',
      par: 1,
      hint: 'The whole call is one WORD, so `W` steps straight over it. Lowercase `w` would take nine presses.',
      motions: ['W'],
    },
    {
      id: 'word-ends',
      prompt: 'Land on the closing paren of the *second* call.',
      startDoc: 'foo.bar() baz.qux()',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursor', line: 0, ch: 18 },
      solution: 'EE',
      par: 2,
      hint: '`E` lands on the last character of a WORD, and the last character here is the `)`.',
      motions: ['E'],
    },
    {
      id: 'back-over-a-url',
      prompt: 'You are at the end of the line. Get back to the very start of it.',
      startDoc: 'const url = "https://example.com/api/v1";',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursor', line: 0, ch: 0 },
      solution: '4B',
      par: 2,
      setupKeys: '$',
      hint: 'Four WORDs back. The whole quoted URL counts as one of them; `b` would need eleven presses.',
      motions: ['B'],
    },
  ],
};
