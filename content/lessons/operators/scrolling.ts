import type { Lesson } from '../../types';

const SHEET = [
  'Cheat sheet, page one',
  '',
  'w    next word start',
  'e    end of this word',
  'b    previous word start',
  '0    column zero',
  '^    first non-blank',
  '$    end of line',
  '',
  'f    find on this line',
  't    till just before',
  ';    repeat the find',
  ',    repeat it backwards',
  '',
  'gg   first line',
  'G    last line',
  '{    paragraph back',
  '}    paragraph forward',
  '',
  'd    delete',
  'c    change',
  'y    yank',
  'p    put',
  '',
  'That is the end of the sheet.',
].join('\n');

export const lesson: Lesson = {
  slug: 'scrolling',
  title: 'Scrolling',
  module: 'operators',
  order: 6,
  keys: ['<C-d>', '<C-u>', 'zz'],
  summary: 'Move the window over the file instead of walking the cursor through it.',
  language: 'text',
  explanation: [
    {
      heading: 'Half a screen at a time',
      body:
        '[[<C-d>]] goes down half a screen, [[<C-u>]] back up. They move the cursor too, so ' +
        'you keep your place, and the line you were reading is still visible after the jump.',
    },
    {
      heading: 'zz moves the window, not you',
      body:
        '[[zz]] redraws with the current line in the middle and leaves the cursor where it ' +
        'is. Land on a match near the bottom edge, tap [[zz]], and you can see the code above ' +
        'and below it. [[zt]] puts the line at the top, [[zb]] at the bottom.',
    },
    {
      heading: 'The honest comparison',
      body:
        'Scrolling is for reading. When you know **what** you are looking for, a search gets ' +
        'there in fewer keys. Skim with [[<C-d>]]; aim with [[/]].',
    },
  ],
  exercises: [
    {
      id: 'page-down',
      prompt: 'Read your way to the bottom: press [[<C-d>]] until you land on the last line.',
      startDoc: SHEET,
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursorOnText', text: 'That is the end of the sheet.' },
      solution: '<C-d><C-d><C-d><C-d><C-d><C-d>',
      par: 6,
      hint: 'Each press covers half the visible window, and the last one stops at the last line.',
      motions: ['<C-d>'],
    },
    {
      id: 'page-up',
      prompt: 'You are at the bottom of the sheet. Get back to the first line with [[<C-u>]].',
      startDoc: SHEET,
      startCursor: { line: 0, ch: 0 },
      setupKeys: 'G',
      goal: { type: 'cursorOnText', text: 'Cheat sheet, page one' },
      solution: '<C-u><C-u><C-u><C-u><C-u><C-u>',
      par: 6,
      hint: '[[<C-u>]] is the exact mirror of [[<C-d>]]. Extra presses at the top are harmless.',
      motions: ['<C-u>'],
    },
    {
      id: 'scroll-then-hop',
      prompt:
        'From the bottom, scroll back to the top with [[<C-u>]], then hop down two blocks to the blank line above the `f` group.',
      startDoc: SHEET,
      startCursor: { line: 0, ch: 0 },
      setupKeys: 'G',
      goal: { type: 'cursor', line: 8, ch: 0 },
      solution: '<C-u><C-u><C-u><C-u><C-u><C-u>}}',
      par: 8,
      hint: 'Scroll to read, then [[}]] to aim. Two different jobs, two different keys.',
      motions: ['<C-u>', '}'],
    },
  ],
};
