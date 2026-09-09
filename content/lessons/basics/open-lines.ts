import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'open-lines',
  title: 'Open lines',
  module: 'basics',
  order: 6,
  keys: ['o', 'O'],
  summary: 'Make room below or above, with the indent already done for you.',
  language: 'text',
  explanation: [
    {
      heading: 'o opens below, O opens above',
      body:
        '[[o]] adds an empty line **below** the current one and drops you into insert mode on ' +
        'it. [[O]] does the same **above**. One key, three things you wanted.',
    },
    {
      heading: 'The indent comes free',
      body:
        'Both keep the indentation of the line you were on, so inside a function body [[o]] ' +
        'puts you at the right column without a space typed.',
    },
    {
      heading: 'Where each one earns its keep',
      body:
        '[[o]] is the next statement or struct field. [[O]] is the import you forgot, the ' +
        'comment above a function, the guard clause you need first.',
    },
  ],
  exercises: [
    {
      id: 'open-below',
      prompt: 'Add a second line reading `done` underneath.',
      startDoc: 'step one',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: 'step one\ndone' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'odone<Esc>',
      par: 6,
      hint: '`o` makes the line and puts you on it in insert mode. Just type.',
      motions: ['o', '<Esc>'],
    },
    {
      id: 'open-above',
      prompt: 'Add `const a = 1;` above the first line.',
      startDoc: 'const b = 2;\nconst c = 3;',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: 'const a = 1;\nconst b = 2;\nconst c = 3;' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'Oconst a = 1;<Esc>',
      par: 14,
      hint: 'Capital `O` opens above. It works on the first line of a file too.',
      motions: ['O', '<Esc>'],
    },
    {
      id: 'indent-kept',
      prompt: 'Add `const b = 2;` on its own line under `const a`, without typing any spaces.',
      startDoc: 'function go() {\n  const a = 1;\n}',
      startCursor: { line: 1, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: 'function go() {\n  const a = 1;\n  const b = 2;\n}' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'oconst b = 2;<Esc>',
      par: 14,
      hint: 'The two spaces of indent are copied for you. Type the statement and nothing else.',
      motions: ['o', '<Esc>'],
    },
  ],
};
