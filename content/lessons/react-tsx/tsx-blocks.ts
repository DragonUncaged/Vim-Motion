import type { Lesson } from '../../types';
import { habitCard } from './habit-card';

export const lesson: Lesson = {
  slug: 'tsx-blocks',
  title: 'Deleting a block',
  module: 'react-tsx',
  order: 4,
  keys: ['dap', 'da{'],
  summary: 'Remove a hook, an import group or a JSX expression without selecting a line.',
  language: 'tsx',
  explanation: [
    {
      heading: 'A paragraph is whatever sits between blank lines',
      body:
        'Vim has no idea what a hook is, but it knows lines 16 to 20 are surrounded by blank ' +
        'ones. [[dap]] deletes the run you are standing in plus the blank line after. In a ' +
        'formatted `.tsx` file a paragraph is almost always exactly one thing.',
    },
    {
      heading: 'da takes the delimiters',
      body:
        '[[da{]] removes a braced block and both braces. On `{habit.name}` that leaves an empty ' +
        'span, which is usually what you meant. [[di{]] would leave you with `{}` still sitting ' +
        'there.',
    },
    {
      heading: 'Both ends of the hook, for free',
      body:
        'Deleting a hook by hand means finding both ends first. [[dap]] is three keys from ' +
        'anywhere inside it, and it takes the trailing blank line too.',
    },
  ],
  exercises: [
    {
      id: 'drop-imports',
      prompt: 'Delete the whole import block at the top of the file.',
      startDoc: habitCard,
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docExcludes', expected: 'from "react"' },
          { type: 'docExcludes', expected: '../types/habit' },
          { type: 'docContains', expected: 'interface HabitCardProps {' },
        ],
      },
      solution: 'dap',
      par: 3,
      hint: 'Both imports and the blank line under them are one paragraph. [[dap]].',
      motions: ['dap'],
    },
    {
      id: 'drop-hook',
      prompt: 'Delete the effect that resets the flash — the one with the timer.',
      startDoc: habitCard,
      startCursor: { line: 17, ch: 4 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docExcludes', expected: 'window.setTimeout' },
          { type: 'docExcludes', expected: 'clearTimeout' },
          { type: 'docContains', expected: '  const toggle = useCallback(() => {' },
        ],
      },
      solution: 'dap',
      par: 3,
      hint: 'The cursor is already inside it, which is all [[dap]] needs.',
      motions: ['dap'],
    },
    {
      id: 'drop-expression',
      prompt: 'Empty the title span: remove the expression and its braces.',
      startDoc: habitCard,
      startCursor: { line: 31, ch: 8 },
      goal: { type: 'docContains', expected: '<span className="title"></span>' },
      solution: 'f{da{',
      par: 5,
      hint: 'Braces included means [[da{]], not [[di{]].',
      motions: ['da{', 'f'],
    },
    {
      id: 'drop-two-blocks',
      prompt: 'Delete the flash effect and the `toggle` callback under it.',
      startDoc: habitCard,
      startCursor: { line: 17, ch: 4 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docExcludes', expected: 'window.setTimeout' },
          { type: 'docExcludes', expected: 'useCallback(' },
          { type: 'docContains', expected: '  return (' },
        ],
      },
      solution: 'dap.',
      par: 4,
      hint: 'After [[dap]] the cursor lands on the next paragraph, so [[.]] eats that one too.',
      motions: ['dap', '.'],
    },
  ],
};
