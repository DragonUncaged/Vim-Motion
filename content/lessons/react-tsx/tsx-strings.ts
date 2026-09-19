import type { Lesson } from '../../types';
import { habitCard } from './habit-card';

export const lesson: Lesson = {
  slug: 'tsx-strings',
  title: 'Swapping a string prop',
  module: 'react-tsx',
  order: 1,
  keys: ['ci"', 'ct"'],
  summary: 'A className is a string in quotes, and quotes are a text object.',
  language: 'tsx',
  explanation: [
    {
      heading: 'The cursor does not have to be on the quote',
      body:
        '`ci"` means change inside quotes. Vim looks along the line for a quoted string, so ' +
        'you can start from the tag name, the prop name, anywhere. Pressing [[f"]] first costs ' +
        'two keys and shows you which string you are about to eat.',
    },
    {
      heading: 'ct keeps the front half',
      body:
        '[[ci"]] throws the whole string away. [[ct"]] changes from the cursor up to — but not ' +
        'including — the closing quote. On `className="card-head"` that is the difference ' +
        'between retyping both halves and retyping one.',
    },
    {
      heading: 'A .tsx file is mostly strings',
      body:
        'Class names, labels, test ids, import paths — a `.tsx` file is mostly strings you ' +
        'keep re-deciding. [[ci"]] is three keys and never picks up the quotes by mistake.',
    },
  ],
  exercises: [
    {
      id: 'swap-classname',
      prompt: "Change the article's className from `card soft` to `card clay`.",
      startDoc: habitCard,
      startCursor: { line: 29, ch: 4 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: 'className="card clay"' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'f"ci"card clay<Esc>',
      par: 15,
      hint: '[[f"]] lands on the opening quote, then [[ci"]] empties the string and leaves you typing.',
      motions: ['ci"', 'f'],
    },
    {
      id: 'ct-keep-prefix',
      prompt: 'The header class is now `card-top` — change only the `head` part.',
      startDoc: habitCard,
      startCursor: { line: 30, ch: 30 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: 'className="card-top"' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'ct"top<Esc>',
      par: 7,
      hint: 'The cursor is already on the `h`. [[ct"]] changes everything from here to the closing quote.',
      motions: ['ct"', 't'],
    },
    {
      id: 'second-string',
      prompt: "Change the button's fallback label from `Mark done` to `Not yet`.",
      startDoc: habitCard,
      startCursor: { line: 38, ch: 8 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: ': "Not yet"}' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: '3f"lci"Not yet<Esc>',
      par: 15,
      hint:
        'Four quote marks on this line, so a count picks the one you want: [[3f"]]. Step one ' +
        'right with [[l]] so the cursor is inside the string before you change it.',
      motions: ['ci"', 'f'],
    },
  ],
};
