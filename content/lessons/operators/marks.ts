import type { Lesson } from '../../types';

const FILE = [
  'const config = load();',
  '',
  'function start() {',
  '  return config.port;',
  '}',
  '',
  'function stop() {',
  '  return config.pid;',
  '}',
].join('\n');

export const lesson: Lesson = {
  slug: 'marks',
  title: 'Marks and jumps',
  module: 'operators',
  order: 11,
  keys: ['m', '`', '<C-o>', '<C-i>'],
  summary: 'Leave a breadcrumb before you wander, and walk the jump list back.',
  language: 'text',
  explanation: [
    {
      heading: 'Drop a mark before you wander',
      body:
        '[[ma]] marks the current spot as `a`. Nothing visible happens, which is the point. ' +
        'Later, [[`a]] puts the cursor back there from anywhere in the file. You get 26, `a` ' +
        'to `z`.',
    },
    {
      heading: 'The jump list remembers for you',
      body:
        'Vim records every big jump — a [[G]], a [[/]], a [[}]] — and [[<C-o>]] walks back ' +
        'through it. [[<C-i>]] walks forward. Most of the time you need no mark at all.',
    },
    {
      heading: 'What you can actually see',
      body:
        'Marks leave no trace in the buffer, so the only thing to watch is **where the cursor ' +
        'lands**. That is what these exercises check.',
    },
  ],
  exercises: [
    {
      id: 'set-and-return',
      prompt:
        'Mark `a` is on the first line and you are at the end of the file; jump straight back to it.',
      startDoc: FILE,
      startCursor: { line: 0, ch: 0 },
      // Starting on the mark would make the goal hold before the first key.
      setupKeys: 'maG',
      goal: { type: 'cursorOnText', text: 'const config' },
      solution: '`a',
      par: 2,
      hint: '[[`a]] returns to mark `a` from anywhere in the file.',
      motions: ['`'],
    },
    {
      id: 'jump-back',
      prompt:
        'You jumped to `return config.port;` and then on to the end of the file. Walk one jump back.',
      startDoc: FILE,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '4GG',
      goal: { type: 'cursorOnText', text: 'return config.port' },
      solution: '<C-o>',
      par: 1,
      hint: '[[<C-o>]] undoes a jump the way [[u]] undoes an edit — one step at a time.',
      motions: ['<C-o>'],
    },
    {
      id: 'jump-forward',
      prompt:
        'You walked back one jump too far. Go forward again to the last line and delete the stray closing brace.',
      startDoc: FILE,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '4GG<C-o>',
      goal: {
        type: 'doc',
        expected: [
          'const config = load();',
          '',
          'function start() {',
          '  return config.port;',
          '}',
          '',
          'function stop() {',
          '  return config.pid;',
        ].join('\n'),
      },
      solution: '<C-i>dd',
      par: 3,
      hint: '[[<C-i>]] is the other direction of [[<C-o>]]. Then [[dd]].',
      motions: ['<C-i>', 'dd'],
    },
  ],
};
