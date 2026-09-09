import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'line-ends',
  title: 'Line ends',
  module: 'basics',
  order: 9,
  keys: ['0', '^', '$'],
  summary: 'Three anchors, and the reason `^` beats `0` on indented code.',
  language: 'text',
  explanation: [
    {
      heading: 'The three anchors',
      body:
        '[[0]] goes to column zero. [[^]] goes to the first character that is not a space or ' +
        'a tab. [[$]] goes to the last character of the line.',
    },
    {
      heading: 'On indented code, ^ is the one you want',
      body:
        'Real code is indented, so column zero is almost always whitespace. [[^]] lands on ' +
        'the first thing that is actually there. Keep [[0]] for when you mean the indentation ' +
        'itself.',
    },
    {
      heading: 'These are motions, not just moves',
      body:
        'Hold on to [[$]]. In three lessons it becomes the noun in `d$`, delete to the end of ' +
        'the line. Every anchor here is also something an operator can eat.',
    },
  ],
  exercises: [
    {
      id: 'first-non-blank',
      prompt: 'Land on the `c` of `const` — the first character that is not indentation.',
      startDoc: '      const indented = true;',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursor', line: 0, ch: 6 },
      solution: '^',
      par: 1,
      setupKeys: '$',
      hint: '`^`, not `0`. `0` would leave you six columns of blank space away from anything.',
      motions: ['^'],
    },
    {
      id: 'strip-the-indent',
      prompt: 'This line should not be indented. Delete the four leading spaces.',
      startDoc: '    console.log(streak);',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'doc', expected: 'console.log(streak);' },
      solution: '04x',
      par: 3,
      setupKeys: '$',
      hint: 'This is the one time you want `0` rather than `^` — the indent is the target.',
      motions: ['0', 'x'],
    },
    {
      id: 'trailing-comma',
      prompt: 'Delete the trailing comma before the closing bracket.',
      startDoc: 'const items = [1, 2, 3,];',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'doc', expected: 'const items = [1, 2, 3];' },
      solution: '$hhx',
      par: 4,
      hint: '`$` puts you on the semicolon. The comma is two steps to the left of it.',
      motions: ['$', 'h', 'x'],
    },
  ],
};
