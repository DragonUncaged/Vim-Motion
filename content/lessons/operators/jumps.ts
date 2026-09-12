import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'jumps',
  title: 'Jumps',
  module: 'operators',
  order: 5,
  keys: ['5j', 'gg', 'G', '{', '}'],
  summary: 'Cross a whole file without scrolling, and skim code a block at a time.',
  language: 'text',
  explanation: [
    {
      heading: 'Top, bottom, and any line',
      body:
        '[[gg]] goes to the first line, [[G]] to the last, and a count in front of [[G]] to ' +
        'that line — [[9G]] is line 9, which is what a compiler hands you.',
    },
    {
      heading: 'Paragraph hops are how you skim code',
      body:
        '[[}]] jumps to the next blank line, [[{]] back to the previous. Code is full of them, ' +
        'so these walk a file declaration by declaration. You land **on** the blank line; one ' +
        '[[j]] puts you in the next block.',
    },
    {
      heading: 'Counts still apply',
      body:
        '[[5j]] is five lines down and [[3}]] three blocks forward. For anything further, ' +
        'search beats counting — two lessons from now.',
    },
  ],
  exercises: [
    {
      id: 'count-down',
      prompt: 'Get down to `function first()` with a count, not five taps of [[j]].',
      startDoc:
        'const a = 1;\nconst b = 2;\n\nfunction first() {\n  return a;\n}\n\nfunction second() {\n  return b;\n}',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursorOnText', text: 'function first' },
      solution: '3j',
      par: 2,
      hint: 'Three lines down: [[3j]].',
      motions: ['j', '3j'],
    },
    {
      id: 'last-line',
      prompt: 'Jump to the last line of the file.',
      startDoc:
        'const a = 1;\nconst b = 2;\n\nfunction first() {\n  return a;\n}\n\nfunction second() {\n  return b;\n}',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursor', line: 9, ch: 0 },
      solution: 'G',
      par: 1,
      hint: 'One key. [[G]].',
      motions: ['G'],
    },
    {
      id: 'goto-line',
      prompt: 'Jump straight to line 9 — the `return b;` line — with a count on [[G]].',
      startDoc:
        'const a = 1;\nconst b = 2;\n\nfunction first() {\n  return a;\n}\n\nfunction second() {\n  return b;\n}',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursorOnText', text: 'return b' },
      solution: '9G',
      par: 2,
      hint: 'Line numbers are 1-based, so line 9 is [[9G]].',
      motions: ['G', '9G'],
    },
    {
      id: 'paragraph-hops',
      prompt:
        'From the last line, get back to the top and then hop down two blocks to the blank line above `function second`.',
      startDoc:
        'const a = 1;\nconst b = 2;\n\nfunction first() {\n  return a;\n}\n\nfunction second() {\n  return b;\n}',
      startCursor: { line: 0, ch: 0 },
      setupKeys: 'G',
      goal: { type: 'cursor', line: 6, ch: 0 },
      solution: 'gg}}',
      par: 4,
      hint: '[[gg]] home, then [[}]] twice. Each hop lands on the blank line between blocks.',
      motions: ['gg', '}'],
    },
  ],
};
