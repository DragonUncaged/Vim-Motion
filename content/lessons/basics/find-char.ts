import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'find-char',
  title: 'Find a character',
  module: 'basics',
  order: 10,
  keys: ['f', 'F', ';', ','],
  summary: 'Teleport to anything you can see on the line.',
  language: 'text',
  explanation: [
    {
      heading: 'f jumps to what you can see',
      body:
        '[[f]] plus any character jumps to the next one on this line: `f=` lands on the equals ' +
        'sign, `f,` on the next comma. [[F]] searches backwards. Neither leaves the line.',
    },
    {
      heading: 'You are already reading the line',
      body:
        'No counting, no aiming. Your eye has already found the character; `f` plus that ' +
        'character is two keys and you are on it. Compare pressing [[w]] six times and ' +
        'overshooting on the seventh.',
    },
    {
      heading: 'Repeat with ; and step back with ,',
      body:
        '[[;]] repeats the last find, [[,]] repeats it the other way. Aim roughly, tap [[;]] ' +
        'until you land, tap [[,]] when you go one too far. A count works too: `3f,`.',
    },
  ],
  exercises: [
    {
      id: 'to-the-equals',
      prompt: 'Jump to the `=` sign.',
      startDoc: 'const total = price * qty;',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursor', line: 0, ch: 12 },
      solution: 'f=',
      par: 2,
      hint: '`f` then the character you are looking at.',
      motions: ['f'],
    },
    {
      id: 'second-comma',
      prompt: 'Land on the second comma.',
      startDoc: 'fn(alpha, beta, gamma, delta)',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursor', line: 0, ch: 14 },
      solution: 'f,;',
      par: 3,
      hint: 'Find the first one, then repeat the find with `;`.',
      motions: ['f', ';'],
    },
    {
      id: 'find-backwards',
      prompt: 'You are at the end of the line. Jump back to the opening `{`.',
      startDoc: 'import { useState, useEffect } from "react";',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursor', line: 0, ch: 7 },
      solution: 'F{',
      par: 2,
      setupKeys: '$',
      hint: 'Capital `F` searches backwards. Same two keys, other direction.',
      motions: ['F'],
    },
    {
      id: 'one-too-far',
      prompt:
        'You overshot — the comma you wanted is the one after `msg`. Step back to it and delete it.',
      startDoc: 'log(level, msg, user, time, trace)',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'doc', expected: 'log(level, msg user, time, trace)' },
      solution: ',x',
      par: 2,
      setupKeys: '3f,',
      hint: '`,` walks the last find backwards one step. Then `x`.',
      motions: [',', 'x'],
    },
  ],
};
