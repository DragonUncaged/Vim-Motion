import type { Lesson } from '../../types';
import { routeTable } from './source';

export const lesson: Lesson = {
  slug: 'global-command',
  title: 'The global command',
  module: 'advanced',
  order: 4,
  keys: [':g', ':v', ':norm'],
  summary: 'Pick the lines that match, then do the same thing to every one of them.',
  language: 'text',
  explanation: [
    {
      heading: 'Match a pattern, run a command',
      body:
        '`:g/pattern/command` finds every line matching the pattern and runs the command on it. ' +
        '`:g/TODO/d` deletes every line mentioning TODO — one pass, however long the file is. ' +
        '`:v/pattern/command` is the same idea inverted: it runs on every line that does **not** ' +
        'match, which is how you throw away everything except the lines you care about.',
    },
    {
      heading: 'The command can be normal-mode keys',
      body:
        '`:g/TODO/normal A done` runs [[A]] `done` [[<Esc>]] on each matching line, and `normal` ' +
        'shortens to `norm`. This is the one to remember: anything you can do with your hands on ' +
        'one line, `:g` can do to every line that matches, and you never see it scroll past.',
    },
    {
      heading: 'And the keys can be a macro',
      body:
        '`:g/pattern/norm @q` fires your recorded macro at each match. The macro no longer needs ' +
        'to end with a [[j]], because `:g` is doing the walking — which also means it cannot ' +
        "wander off onto a line you did not mean. Record it, press [[u]] to take the recording's " +
        'own edit back, then let `:g` place it everywhere.',
    },
  ],
  exercises: [
    {
      id: 'drop-the-todos',
      prompt: 'The two unfinished routes are not shipping. Delete every line marked `TODO`.',
      startDoc: routeTable,
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'doc',
        expected:
          'GET    /health          health.check\nGET    /sessions        sessions.list\n' +
          'POST   /sessions        sessions.create\nDELETE /sessions/:id    sessions.destroy',
      },
      solution: ':g/TODO/d<CR>',
      par: 10,
      hint: '`:g` picks the lines; `d` is what happens to each one.',
      motions: [':g'],
    },
    {
      id: 'keep-only-sessions',
      prompt:
        'You only want the session routes. Throw away every line that does not mention `sessions`.',
      startDoc: routeTable,
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'doc',
        expected:
          'GET    /sessions        sessions.list\nPOST   /sessions        sessions.create\n' +
          'DELETE /sessions/:id    sessions.destroy',
      },
      solution: ':v/sessions/d<CR>',
      par: 14,
      hint: '`:v` is `:g` turned inside out — it runs on the lines that miss.',
      motions: [':v'],
    },
    {
      id: 'mark-the-todos',
      prompt:
        'Append ` (unowned)` to the end of every `TODO` line, without visiting either of them.',
      startDoc: routeTable,
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: 'users.list      TODO (unowned)' },
          { type: 'docContains', expected: 'users.create    TODO (unowned)' },
          { type: 'docContains', expected: 'health.check\n' },
        ],
      },
      solution: ':g/TODO/norm A (unowned)<CR>',
      par: 25,
      hint: '`norm` hands the rest of the line to your fingers: [[A]], the text, and `:g` supplies the [[<Esc>]].',
      motions: [':g', ':norm', 'A'],
    },
    {
      id: 'global-macro',
      prompt:
        'The cursor is on the first `TODO` line. Record a macro that comments the line out, undo it, then let `:g` run it on both.',
      startDoc: routeTable,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '5G',
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: '# GET    /users           users.list      TODO' },
          { type: 'docContains', expected: '# POST   /users           users.create    TODO' },
          { type: 'docContains', expected: '\nGET    /sessions        sessions.list\n' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'qqI# <Esc>qu:g/TODO/norm @q<CR>',
      par: 27,
      hint: 'Record, stop, [[u]], then `:g/TODO/norm @q`. The [[u]] is why the first line is not commented twice.',
      motions: [':g', ':norm', '@'],
    },
  ],
};
