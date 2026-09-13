import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'macros',
  title: 'Macros',
  module: 'operators',
  order: 12,
  keys: ['q', '@', '@@'],
  summary: 'Record yourself doing it once, then make the editor do it forty more times.',
  language: 'text',
  explanation: [
    {
      heading: 'Record, stop, replay',
      body:
        '[[qq]] starts recording into register `q` — first `q` is the command, second is the ' +
        'register, any letter will do. [[q]] again stops. [[@q]] plays it back, [[@@]] replays ' +
        'the last one.',
    },
    {
      heading: 'Finish the recording on the next line',
      body:
        'End the recording with the move to the next target, usually a [[j]]. Each replay then ' +
        'does the edit **and** steps forward, so [[@q]] [[@@]] [[@@]] walks down the file. ' +
        '[[10@q]] runs it ten times — count the lines, because here a macro that runs off the ' +
        'end keeps editing the last one rather than stopping.',
    },
    {
      heading: 'When to reach for one',
      body:
        'Anything you will do more than three times where [[.]] is not enough: twenty lines to ' +
        'wrap in quotes, a column of constants to renumber. Record it slowly once.',
    },
  ],
  exercises: [
    {
      id: 'record-and-replay',
      prompt:
        'Record a macro into `q` that adds a semicolon and steps down a line, then replay it on the second line.',
      startDoc: 'const a = 1\nconst b = 2',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: 'const a = 1;\nconst b = 2;' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'qqA;<Esc>jq@q',
      par: 9,
      hint: '[[qq]] to record, [[A]] `;` [[<Esc>]] [[j]] to do the work, [[q]] to stop, [[@q]] to replay.',
      motions: ['q', '@'],
    },
    {
      id: 'replay-again',
      prompt: 'Same macro, four lines. Record it once, then replay it with [[@q]] and two [[@@]]s.',
      startDoc: 'const a = 1\nconst b = 2\nconst c = 3\nconst d = 4',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          {
            type: 'doc',
            expected: 'const a = 1;\nconst b = 2;\nconst c = 3;\nconst d = 4;',
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'qqA;<Esc>jq@q@@@@',
      par: 13,
      hint: '[[@@]] means "that one again", so you never have to name the register twice.',
      motions: ['q', '@', '@@'],
    },
    {
      id: 'quote-the-list',
      prompt:
        'Turn every line into a quoted, comma-terminated entry. Record the edit on `red`, then replay it down the list.',
      startDoc: 'red\ngreen\nblue',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: '"red",\n"green",\n"blue",' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'qqI"<Esc>A",<Esc>jq@q@@',
      par: 15,
      hint: '[[I]] puts the opening quote at the front, [[A]] puts `",` at the end, [[j]] sets up the next run.',
      motions: ['q', '@', '@@'],
    },
  ],
};
