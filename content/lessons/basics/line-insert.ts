import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'line-insert',
  title: 'Insert at line ends',
  module: 'basics',
  order: 5,
  keys: ['I', 'A'],
  summary: 'Uppercase means the whole line. These two do most of the work in real code.',
  language: 'text',
  explanation: [
    {
      heading: 'Uppercase means the line',
      body:
        '[[i]] and [[a]] work on the character under the cursor. Their capitals work on the ' +
        'line: [[I]] types at the first non-blank character, [[A]] at the end. Neither cares ' +
        'where the cursor sits, which is the point.',
    },
    {
      heading: 'Why these two get used most',
      body:
        'What do you actually add to a line of code? A semicolon at the end. A `//` or an ' +
        '`await` at the front. Almost nothing in the middle. [[A]] and [[I]] hit those two ' +
        'spots from anywhere on the line.',
    },
    {
      heading: 'I skips the indent',
      body:
        '[[I]] lands on the first character that is not a space or a tab, not on column zero. ' +
        'On indented code that is always what you meant.',
    },
  ],
  exercises: [
    {
      id: 'missing-semicolon',
      prompt: 'Add the missing semicolon at the end of the line.',
      startDoc: 'const ok = true',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: 'const ok = true;' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'A;<Esc>',
      par: 3,
      hint: '`A` goes to the end of the line and starts typing. No need to move there first.',
      motions: ['A', '<Esc>'],
    },
    {
      id: 'comment-it-out',
      prompt: 'Comment this line out by putting `// ` in front of the code.',
      startDoc: '  broken();',
      startCursor: { line: 0, ch: 8 },
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: '  // broken();' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'I// <Esc>',
      par: 5,
      hint: '`I` lands after the indent, on the `b`. Type `// ` with the trailing space.',
      motions: ['I', '<Esc>'],
    },
    {
      id: 'missing-comma',
      prompt: 'The `retries` line is missing its trailing comma. Add it.',
      startDoc: 'const config = {\n  retries: 3\n  timeout: 500\n}',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: 'const config = {\n  retries: 3,\n  timeout: 500\n}' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'jA,<Esc>',
      par: 4,
      hint: 'Drop down one line with `j`, then `A` takes you to the end of it.',
      motions: ['j', 'A', '<Esc>'],
    },
  ],
};
