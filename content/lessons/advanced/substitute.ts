import type { Lesson } from '../../types';
import { envFile, routeTable } from './source';

export const lesson: Lesson = {
  slug: 'substitute',
  title: 'Substitute',
  module: 'advanced',
  order: 3,
  keys: [':s', ':%s', '/g'],
  summary: 'Find and replace, with a range you choose and a pattern you have already seen.',
  language: 'text',
  explanation: [
    {
      heading: 'Range, pattern, replacement, flags',
      body:
        '`:%s/old/new/g` reads left to right: `%` is the range — the whole file — `s` is ' +
        'substitute, then the pattern, then what to put in its place, then the flags. `g` means ' +
        'every match on the line rather than only the first. Leave the range off and it works ' +
        'on the current line alone; add `c` to the flags and it asks before each one.',
    },
    {
      heading: 'The range is the safety',
      body:
        '`%` is the whole file and it is the one people reach for by reflex. `5,9` is lines five ' +
        'to nine, `.,+2` is this line and the next two, and `1,.` is everything above you. Two ' +
        'blocks that look alike are exactly where a `%` does damage you will not notice for a ' +
        'week, so **narrow the range before you widen the pattern**.',
    },
    {
      heading: 'Search first, substitute second',
      body:
        'Leave the pattern empty and `:%s//new/` reuses your last search. So the safe order is ' +
        'the honest one: [[/]] the pattern first, press [[n]] a few times to see what you are ' +
        'about to hit, and only then substitute. On this site the pattern is a JavaScript ' +
        "regular expression rather than vim's own dialect, so groups are written `(…)` and " +
        'come back as `$1`.',
    },
  ],
  exercises: [
    {
      id: 'rename-everywhere',
      prompt: 'The resource is called `tokens` now. Rename every `sessions` in the file.',
      startDoc: routeTable,
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docExcludes', expected: 'sessions' },
          { type: 'docContains', expected: 'GET    /tokens        tokens.list' },
          { type: 'docContains', expected: 'DELETE /tokens/:id    tokens.destroy' },
        ],
      },
      solution: ':%s/sessions/tokens/g<CR>',
      par: 22,
      hint: 'Two of the lines say `sessions` twice, so the `g` flag is doing real work.',
      motions: [':%s'],
    },
    {
      id: 'narrow-the-range',
      prompt:
        'Production was copied from staging and never edited. Point only the production block at `live` — the staging block above it must not change.',
      startDoc: envFile,
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'doc',
        expected:
          '# staging\nurl: api.staging.local\nkey: staging-key\n# production\nurl: api.live.local\nkey: live-key',
      },
      solution: ':5,6s/staging/live/g<CR>',
      par: 21,
      hint: 'The two lines you want are 5 and 6. A `%` here would quietly break staging too.',
      motions: [':s'],
    },
    {
      id: 'reuse-the-search',
      prompt:
        'Search for `TODO` so you can see both matches, then substitute them for `done` without typing the pattern again.',
      startDoc: routeTable,
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docExcludes', expected: 'TODO' },
          { type: 'docContains', expected: 'users.list      done' },
          { type: 'docContains', expected: 'users.create    done' },
        ],
      },
      solution: '/TODO<CR>:%s//done/<CR>',
      par: 17,
      hint: 'An empty pattern — `:%s//done/` — means "the thing I just searched for".',
      motions: [':%s', '/'],
    },
  ],
};
