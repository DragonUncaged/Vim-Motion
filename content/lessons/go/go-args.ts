import type { Lesson } from '../../types';
import { storeGo } from './source';

export const lesson: Lesson = {
  slug: 'go-args',
  title: 'Reordering arguments',
  module: 'go',
  order: 4,
  keys: ['ct)', 'f,', ';'],
  summary: 'Surgery inside a call, without counting a single character.',
  language: 'go',
  explanation: [
    {
      heading: 'Commas are landmarks',
      body:
        '[[f,]] jumps to the next comma on the line and [[;]] repeats that jump. Two keys and a ' +
        'semicolon put you on the second argument of anything, however long the types are. ' +
        '[[,]] goes back the other way when you overshoot.',
    },
    {
      heading: 'ct) changes the rest of the call',
      body:
        '[[ct)]] deletes from the cursor up to — but not including — the closing paren and ' +
        'drops you into insert mode. That is the whole move for reordering arguments: land on ' +
        'the first one you want to change, [[ct)]], type the new order.',
    },
    {
      heading: 'Till, not onto',
      body:
        '`t` means **till**: it stops before its target instead of on it, which is what you ' +
        'want when the target is a delimiter you intend to keep.',
    },
  ],
  exercises: [
    {
      id: 'second-comma',
      prompt: "Land on the second comma in `Rotate`'s signature.",
      startDoc: storeGo,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '40G',
      goal: { type: 'cursor', line: 39, ch: 53 },
      solution: 'f,;',
      par: 3,
      hint: '[[f,]] for the first, [[;]] to do it again.',
      motions: ['f', ';'],
    },
    {
      id: 'rename-last-param',
      prompt: "Rename `Rotate`'s last parameter from `now` to `at`, keeping its type.",
      startDoc: storeGo,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '40G',
      goal: {
        type: 'all',
        goals: [
          {
            type: 'docContains',
            expected:
              'func (s *Store) Rotate(ctx context.Context, id string, at time.Time) error {',
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'f,;wct)at time.Time<Esc>',
      par: 20,
      hint: 'Walk the commas to the last parameter, [[w]] onto it, then [[ct)]] and retype.',
      motions: ['ct)', 'f', ';', 'w'],
    },
    {
      id: 'reorder-newtoken',
      prompt: '`newToken` takes the clock first now. Swap its two arguments.',
      startDoc: storeGo,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '46G',
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: 'newToken(now, sess.UserID)' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'f(lct)now, sess.UserID<Esc>',
      par: 23,
      hint: '[[f(]] then [[l]] puts you on the first argument. [[ct)]] takes the rest.',
      motions: ['ct)', 'f'],
    },
  ],
};
