import type { Lesson } from '../../types';
import { habitCard } from './habit-card';

export const lesson: Lesson = {
  slug: 'tsx-braces',
  title: 'JSX expression braces',
  module: 'react-tsx',
  order: 2,
  keys: ['ci{', 'ca{'],
  summary: 'Every escape hatch out of JSX is a pair of braces, and braces are a text object.',
  language: 'tsx',
  explanation: [
    {
      heading: 'Inside the braces',
      body:
        '[[ci{]] changes everything between `{` and its matching `}` and leaves the braces. ' +
        'One key sequence for `{habit.name}`, for `onClick={() => toggle()}`, and for a prop ' +
        'object three levels down.',
    },
    {
      heading: 'a takes the braces with it',
      body:
        '[[ca{]] is the same object plus its delimiters. Use it when the braces themselves are ' +
        'the thing you are removing: `className={cond ? "a" : "b"}` becomes `className="b"` in ' +
        'one go, because [[ca{]] deletes the `{...}` and drops you into insert mode in its place.',
    },
    {
      heading: 'Let vim count the braces',
      body:
        'JSX is delimiter soup, and counting closing braces by eye goes wrong once in five. ' +
        'Vim counts them, nesting included.',
    },
  ],
  exercises: [
    {
      id: 'swap-expression',
      prompt: 'The field was renamed: make the title render `{habit.title}`.',
      startDoc: habitCard,
      startCursor: { line: 31, ch: 8 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: '>{habit.title}<' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'f{ci{habit.title<Esc>',
      par: 17,
      hint: '[[f{]] to reach the brace, then [[ci{]] — the closing brace looks after itself.',
      motions: ['ci{', 'f'],
    },
    {
      id: 'empty-onclick',
      prompt: "Empty the button's `onClick` expression, keeping its braces.",
      startDoc: habitCard,
      startCursor: { line: 36, ch: 8 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: 'onClick={}' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'f{ci{<Esc>',
      par: 6,
      hint: 'The arrow function has parens inside it. [[ci{]] does not care.',
      motions: ['ci{', 'f'],
    },
    {
      id: 'unwrap-classname',
      prompt: 'Drop the conditional class: the button should just have `className="toggle"`.',
      startDoc: habitCard,
      startCursor: { line: 35, ch: 8 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: 'className="toggle"' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'f{ca{"toggle"<Esc>',
      par: 14,
      hint: 'You want the braces gone too, so this is [[ca{]], not [[ci{]].',
      motions: ['ca{', 'f'],
    },
    {
      id: 'search-then-change',
      prompt: 'From the top of the file, format the streak count as `{streak.toLocaleString()}`.',
      startDoc: habitCard,
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: '{streak.toLocaleString()} days' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: '/streak}<CR>ci{streak.toLocaleString()<Esc>',
      par: 36,
      hint: 'Search is a motion. `/streak}` lands you inside the right pair of braces, then [[ci{]].',
      motions: ['ci{', '/'],
    },
  ],
};
