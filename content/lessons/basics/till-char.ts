import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'till-char',
  title: 'Till a character',
  module: 'basics',
  order: 11,
  keys: ['t', 'T'],
  summary: 'Stop one short — the version you actually want next to an operator.',
  language: 'text',
  explanation: [
    {
      heading: 'One character short of f',
      body:
        '[[t]] works like [[f]] but stops on the character **before** the one you named. `t)` ' +
        'parks just inside the closing paren; `f)` parks on it. [[T]] is the backwards version.',
    },
    {
      heading: 'Why anyone would want to stop short',
      body:
        'The payoff is in the next lesson, where a motion becomes something you can ' +
        '**delete**. `dt,` clears everything up to the comma and leaves the comma — which ' +
        'usually has to stay. `df,` would eat it and break the syntax.',
    },
    {
      heading: 'A preview, on purpose',
      body:
        'The last two exercises use [[dt,]] and [[dt)]] before `d` is introduced, on purpose. ' +
        'Read `dt)` as "delete till the closing paren" and it does what it says.',
    },
  ],
  exercises: [
    {
      id: 'stop-short',
      prompt: 'Land on the last character inside the parentheses, without landing on the paren.',
      startDoc: 'console.log(streak)',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursor', line: 0, ch: 17 },
      solution: 't)',
      par: 2,
      hint: '`t)` stops one short of the `)`. `f)` would land on it.',
      motions: ['t'],
    },
    {
      id: 'till-backwards',
      prompt: 'You are at the end of the line. Land on the first character inside the call.',
      startDoc: 'const dir = path.join(root, "src");',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursor', line: 0, ch: 22 },
      solution: 'T(',
      par: 2,
      setupKeys: '$',
      hint: 'Capital `T` searches backwards and stops just *after* what it finds.',
      motions: ['T'],
    },
    {
      id: 'keep-the-comma',
      prompt: 'Delete `alpha`, leaving the comma exactly where it is.',
      startDoc: 'fn(alpha, beta, gamma)',
      startCursor: { line: 0, ch: 3 },
      goal: { type: 'doc', expected: 'fn(, beta, gamma)' },
      solution: 'dt,',
      par: 3,
      hint: 'Read it as three parts: delete, till, comma.',
      motions: ['dt,'],
    },
    {
      id: 'keep-the-parens',
      prompt: 'Empty the call, keeping both parentheses.',
      startDoc: 'setStreak(streak + 1)',
      startCursor: { line: 0, ch: 10 },
      goal: { type: 'doc', expected: 'setStreak()' },
      solution: 'dt)',
      par: 3,
      hint: '`dt)` stops short of the closing paren. `df)` would take it with everything else.',
      motions: ['dt)'],
    },
  ],
};
