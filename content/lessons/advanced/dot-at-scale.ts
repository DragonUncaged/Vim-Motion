import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'dot-at-scale',
  title: 'Dot at scale',
  module: 'advanced',
  order: 5,
  keys: ['.', 'gn', 'cgn'],
  summary: 'The dot takes a count, and gn turns your last search into the thing it aims at.',
  language: 'text',
  explanation: [
    {
      heading: 'The dot carries the count',
      body:
        'Repeat a counted change and the count comes with it: [[3dd]] then [[.]] is six lines ' +
        'gone. Give the dot a count of its own and that one wins instead — [[dw]] then [[3.]] ' +
        'deletes three more words, not one. So the count is part of the change, and you can ' +
        'change your mind about it on the way.',
    },
    {
      heading: 'Search, change, then n and dot',
      body:
        'The pairing worth building a habit around is [[/]] to find the first one, the change, ' +
        'then [[n]] [[.]] [[n]] [[.]] down the file. Two keys per fix, and you see each one ' +
        'before it happens — which is the difference between this and a `:%s` that has already ' +
        'edited nine places you were not looking at.',
    },
    {
      heading: 'gn removes the n',
      body:
        '[[gn]] selects the next match of your last search — the one you are on, if you are on ' +
        'one. So [[cgn]] changes it, [[dgn]] deletes it, and because that is a single change, ' +
        '[[.]] finds the **next** match and does it again. Search once, [[cgn]] once, then hold ' +
        '[[.]]. It is the closest thing vim has to multiple cursors and it costs one key each.',
    },
  ],
  exercises: [
    {
      id: 'counted-dot',
      prompt: 'Six lines have to go. Delete three of them with one command, then repeat it once.',
      startDoc: 'keep this\ndrop 1\ndrop 2\ndrop 3\ndrop 4\ndrop 5\ndrop 6\nkeep this too',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: 'keep this\nkeep this too' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'j3dd.',
      par: 5,
      hint: 'The [[.]] brings the [[3]] along with it.',
      motions: ['.', '3dd'],
    },
    {
      id: 'new-count',
      prompt:
        'Drop all four flags from this command line, using a count on the dot rather than pressing it three more times.',
      startDoc: 'git log --oneline --graph --decorate --all main',
      startCursor: { line: 0, ch: 0 },
      setupKeys: 'ww',
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: 'git log main' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'dW3.',
      par: 4,
      hint: '[[W]] rather than [[w]], or the leading `--` counts as a word of its own.',
      motions: ['.', 'dW'],
    },
    {
      id: 'search-and-dot',
      prompt:
        'Search for `debug`, change the first one to `trace`, then walk the other two with [[n]] and [[.]].',
      startDoc: 'log.debug("boot")\nlog.debug("ready")\nlog.debug("serve")\nlog.info("done")',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          {
            type: 'doc',
            expected: 'log.trace("boot")\nlog.trace("ready")\nlog.trace("serve")\nlog.info("done")',
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: '/debug<CR>ciwtrace<Esc>n.n.',
      par: 20,
      hint: 'The `info` line must survive, so this is a walk rather than a `:%s`.',
      motions: ['.', 'n', 'ciw'],
    },
    {
      id: 'change-gn',
      prompt:
        'Same job, without the [[n]]s. Search for `draft`, then change every match with [[cgn]] and two dots.',
      startDoc: 'const label = "draft";\nconst title = "draft";\nconst slug  = "draft";',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          {
            type: 'doc',
            expected: 'const label = "final";\nconst title = "final";\nconst slug  = "final";',
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: '/draft<CR>cgnfinal<Esc>..',
      par: 18,
      hint: '[[cgn]] aims itself at the next match, so the dot no longer needs help getting there.',
      motions: ['cgn', '.'],
    },
    {
      id: 'delete-gn',
      prompt:
        'The first argument is redundant everywhere. Search for `ok, ` and delete all three with [[dgn]] and two dots.',
      startDoc:
        'assert(ok, "must be ok");\nassert(ok, "must be set");\nassert(ok, "must be live");',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          {
            type: 'doc',
            expected: 'assert("must be ok");\nassert("must be set");\nassert("must be live");',
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: '/ok, <CR>dgn..',
      par: 11,
      hint: 'The trailing space belongs in the pattern, or you will be left tidying up after it.',
      motions: ['dgn', '.'],
    },
  ],
};
