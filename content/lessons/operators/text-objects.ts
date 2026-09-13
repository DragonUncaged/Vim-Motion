import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'text-objects',
  title: 'Text objects',
  module: 'operators',
  order: 8,
  keys: ['iw', 'aw', 'i{', 'a{', 'i"', 'a"', 'ip', 'ap'],
  summary: 'Stop counting characters. Say what you mean: inside the quotes, around the block.',
  language: 'text',
  explanation: [
    {
      heading: 'Inner and around',
      body:
        'A text object is a noun you hand to an operator. [[i]] is **inner**, just the ' +
        'contents; [[a]] is **around**, contents plus delimiters. So [[di"]] empties a string ' +
        'and leaves the quotes; [[da"]] takes them too. Same pair on every object: [[iw]] ' +
        '[[aw]], [[i{]] [[a{]], [[i(]] [[a(]], [[ip]] [[ap]].',
    },
    {
      heading: 'Why it wins: the cursor can be anywhere inside',
      body:
        '[[ciw]] changes the word you are standing in — start, end or middle, it does not ' +
        'matter. [[ci"]] works from anywhere in the string. [[di{]] guts a block from any line ' +
        'inside it. **No aiming and no counting.**',
    },
    {
      heading: 'The five you will use every day',
      body:
        '[[ciw]] rename this thing. [[ci"]] rewrite this string. [[ci(]] rewrite these ' +
        'arguments. [[di{]] empty this block. [[dap]] delete this paragraph — usually an ' +
        'import group or a function.',
    },
  ],
  exercises: [
    {
      id: 'ciw',
      prompt: 'The cursor is parked in the middle of `middle`. Change the whole word to `center`.',
      startDoc: 'align: middle;',
      startCursor: { line: 0, ch: 0 },
      setupKeys: 'fd',
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: 'align: center;' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'ciwcenter<Esc>',
      par: 10,
      hint: 'Do not move first. [[ciw]] takes the word you are standing in.',
      motions: ['ciw'],
    },
    {
      id: 'ci-quote',
      prompt:
        'The cursor is somewhere in the middle of the string. Replace its contents with `saved`.',
      startDoc: 'const msg = "delete this text";',
      startCursor: { line: 0, ch: 0 },
      setupKeys: 'fh',
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: 'const msg = "saved";' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'ci"saved<Esc>',
      par: 9,
      hint: '[[ci"]] — inner quotes. The quotes themselves survive; [[ca"]] would take them too.',
      motions: ['ci"'],
    },
    {
      id: 'di-brace',
      prompt: 'Gut the body of `reset()` from where you stand, leaving the braces behind.',
      startDoc: 'function reset() {\n  count = 0;\n  streak = 0;\n}',
      startCursor: { line: 2, ch: 5 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: 'function reset() {' },
          { type: 'docExcludes', expected: 'count' },
          { type: 'docExcludes', expected: 'streak' },
        ],
      },
      solution: 'di{',
      par: 3,
      hint: 'You are on the second body line, and it does not matter. [[di{]].',
      motions: ['di{'],
    },
    {
      id: 'dap',
      prompt: 'Delete the whole import block — both lines and the blank line under it.',
      startDoc:
        'import { useState } from "react";\nimport { useEffect } from "react";\n\nexport function Card() {\n  return null;\n}',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'doc',
        expected: 'export function Card() {\n  return null;\n}',
      },
      solution: 'dap',
      par: 3,
      hint: 'A paragraph is a run of non-blank lines. [[dap]] takes the blank line too; [[dip]] leaves it.',
      motions: ['dap'],
    },
  ],
};
