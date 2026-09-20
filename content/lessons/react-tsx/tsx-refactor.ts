import type { Lesson } from '../../types';
import { habitCard } from './habit-card';

export const lesson: Lesson = {
  slug: 'tsx-refactor',
  title: 'Rename a prop across a file',
  module: 'react-tsx',
  order: 6,
  keys: ['*', 'cw', 'n', '.'],
  summary: 'Find it, change it once, then repeat the change on every other use.',
  language: 'tsx',
  explanation: [
    {
      heading: 'Star searches for the word you are standing on',
      body:
        'Put the cursor anywhere in `onToggle` and press [[*]]. Vim jumps to the next use and ' +
        'remembers it as the search, so [[n]] walks the rest and wraps round.',
    },
    {
      heading: 'Dot repeats the last change',
      body:
        '[[.]] replays your last edit, insert-mode typing and all. [[cw]] then `onSelect` then ' +
        '[[<Esc>]] is one change, and every later occurrence costs [[n]] [[.]]. Prefer [[cw]] ' +
        'over `ciw` here: from the start of a match it is the one that repeats cleanly.',
    },
    {
      heading: 'Faster than a substitute, and it shows you each one',
      body:
        '`:%s///g` also hits the string in a comment and the substring in `onToggleAll`. ' +
        '[[n]] [[.]] shows you each match first, and skipping one costs a single [[n]].',
    },
  ],
  exercises: [
    {
      id: 'star-jump',
      prompt: 'The cursor is on the `onToggle` prop. Jump to its next use in the file.',
      startDoc: habitCard,
      startCursor: { line: 5, ch: 2 },
      goal: { type: 'cursorOnText', text: 'onToggle', occurrence: 1 },
      solution: '*',
      par: 1,
      hint: 'One key. [[*]] searches for whatever word you are standing on.',
      motions: ['*'],
    },
    {
      id: 'rename-one',
      prompt: 'Rename just this call site from `onToggle` to `onSelect`.',
      startDoc: habitCard,
      startCursor: { line: 25, ch: 4 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: 'onSelect(habit.id, !habit.done);' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'cwonSelect<Esc>',
      par: 11,
      hint: '[[cw]] stops at the `(`, so you do not have to.',
      motions: ['cw'],
    },
    {
      id: 'star-then-change',
      prompt: 'Jump to the next use of `onToggle` and rename that one to `onSelect`.',
      startDoc: habitCard,
      startCursor: { line: 5, ch: 2 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: '{ habit, onSelect }: HabitCardProps' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: '*cwonSelect<Esc>',
      par: 12,
      hint: '[[*]] first, then the change. The one you were standing on stays as it was.',
      motions: ['*', 'cw'],
    },
    {
      id: 'sweep-the-file',
      prompt: 'Rename the prop everywhere: all four uses of `onToggle` become `onSelect`.',
      startDoc: habitCard,
      startCursor: { line: 5, ch: 2 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docExcludes', expected: 'onToggle' },
          { type: 'docContains', expected: '  onSelect: (id: string, done: boolean) => void;' },
          { type: 'docContains', expected: '{ habit, onSelect }: HabitCardProps' },
          { type: 'docContains', expected: '    onSelect(habit.id, !habit.done);' },
          { type: 'docContains', expected: '[onSelect, habit.id, habit.done]' },
        ],
      },
      solution: '*cwonSelect<Esc>n.n.n.',
      par: 18,
      hint:
        'After the first change it is [[n]] [[.]] three times. The third [[n]] wraps round to ' +
        'the declaration you started on.',
      motions: ['*', 'cw', 'n', '.'],
    },
  ],
};
