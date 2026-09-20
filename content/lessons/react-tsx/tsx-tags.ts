import type { Lesson } from '../../types';
import { habitCard } from './habit-card';

export const lesson: Lesson = {
  slug: 'tsx-tags',
  title: 'Hopping tags',
  module: 'react-tsx',
  order: 5,
  // Display labels, rendered verbatim: no <lt> escape here.
  keys: ['f<', 't>', 'ci<'],
  summary: 'Angle brackets are landmarks. Use them to move, and to rewrite a tag.',
  language: 'tsx',
  explanation: [
    {
      heading: 'Two characters you can always aim at',
      body:
        'Markup puts `<` and `>` on nearly every line, so [[f<lt>]] and [[t>]] are the cheapest ' +
        'way across it. [[f<lt>]] lands on the next angle bracket. [[t>]] stops one short, ' +
        'which is where an operator wants to end: `dt>` strips every prop and leaves the tag.',
    },
    {
      heading: 'Angle brackets are a text object too',
      body:
        '[[ci<lt>]] rewrites everything between `<` and `>`. On a closing tag that is the whole ' +
        'job: `</header>` becomes `</div>` in seven keys. On an opening tag it would take the ' +
        'props with it, so for those step one character right and use [[cw]] on just the name.',
    },
    {
      heading: 'Two edits that have to agree',
      body:
        'Forgetting the closing half is the most common JSX typo. Doing both seconds apart is ' +
        'how you stop making it.',
    },
  ],
  exercises: [
    {
      id: 'hop-to-closing-tag',
      prompt: 'Hop from the opening `<span>` to the `<` of its closing tag.',
      startDoc: habitCard,
      startCursor: { line: 31, ch: 8 },
      goal: { type: 'cursor', line: 31, ch: 44 },
      solution: 'f<lt>',
      par: 2,
      hint: 'One [[f<lt>]] from the opening bracket skips the whole tag and its expression.',
      motions: ['f<'],
    },
    {
      id: 'strip-props',
      prompt: 'Strip the className off the article tag, leaving `<article>`.',
      startDoc: habitCard,
      startCursor: { line: 29, ch: 4 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: '<article>' },
          { type: 'docExcludes', expected: 'card soft' },
        ],
      },
      solution: 'f<Space>dt>',
      par: 5,
      hint: 'Find the space after the tag name, then delete up to — not including — the `>`.',
      motions: ['t>', 'f'],
    },
    {
      id: 'rename-closing-tag',
      prompt: 'Rename the closing tag to `</div>`.',
      startDoc: habitCard,
      startCursor: { line: 33, ch: 6 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: '</div>' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'ci<lt>/div<Esc>',
      par: 8,
      hint: 'The slash is part of what is inside the brackets, so type it back: `/div`.',
      motions: ['ci<'],
    },
    {
      id: 'rename-opening-tag',
      prompt: 'Now rename the opening tag to `div`, keeping its className.',
      startDoc: habitCard,
      startCursor: { line: 30, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: '<div className="card-head">' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'f<lt>lcwdiv<Esc>',
      par: 9,
      hint: '[[ci<lt>]] would eat the className too. Step one right off the bracket and use [[cw]].',
      motions: ['f<', 'cw'],
    },
  ],
};
