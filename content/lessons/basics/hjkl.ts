import type { Lesson } from '../../types';

const DECLS = ['const a = 1;', 'const b = 2;', 'const c = 3;', 'const d = 4;'].join('\n');

const FILE = [
  'import { useState } from "react";',
  '',
  'const a = 1;',
  'const b = 2;',
  'const c = 3;',
  'const d = 4;',
  'const e = 5;',
  'const f = 6;',
  'export default a;',
].join('\n');

export const lesson: Lesson = {
  slug: 'hjkl',
  title: 'h j k l',
  module: 'basics',
  order: 2,
  keys: ['h', 'j', 'k', 'l'],
  summary: 'Move without your hand ever leaving home row.',
  language: 'text',
  explanation: [
    {
      heading: 'Left, down, up, right',
      body:
        '[[h]] left, [[j]] down, [[k]] up, [[l]] right — under your right hand where it ' +
        'already rests. If it will not stick: `j` hooks down, `k` pokes up, `h` and `l` are ' +
        'the outer two.',
    },
    {
      heading: 'The arrow keys are the point',
      body:
        'Arrow keys work, but they live in a corner of the keyboard, so every use costs a ' +
        'trip out and back — thousands a day. The first exercise below refuses them on purpose.',
    },
    {
      heading: 'Counts multiply anything',
      body:
        'Type a number first and the motion repeats: [[5j]] jumps five lines down, [[12l]] ' +
        'twelve characters right. **Every** motion here takes a count.',
    },
  ],
  exercises: [
    {
      id: 'home-row-only',
      prompt: 'Land on the `4` in the last line. Arrow keys are switched off for this one.',
      startDoc: DECLS,
      startCursor: { line: 0, ch: 11 },
      goal: { type: 'cursor', line: 3, ch: 10 },
      solution: 'jjjh',
      par: 4,
      hint: 'Three hops down with `j`, then one step left with `h`.',
      allowedKeys: ['h', 'j', 'k', 'l'],
      motions: ['j', 'h'],
    },
    {
      id: 'count-down',
      prompt: 'Jump to the `export` line at the bottom with a single counted [[j]].',
      startDoc: FILE,
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursor', line: 8, ch: 0 },
      solution: '8j',
      par: 2,
      hint: 'It is eight lines down. Type the count, then the motion: `8j`.',
      motions: ['j'],
    },
    {
      id: 'count-across',
      prompt: 'Land on the `6` one line up.',
      startDoc: FILE,
      startCursor: { line: 8, ch: 0 },
      goal: { type: 'cursor', line: 7, ch: 10 },
      solution: 'k10l',
      par: 4,
      hint: 'One line up, then ten characters right. Counts work on `l` exactly as they do on `j`.',
      motions: ['k', 'l'],
    },
  ],
};
