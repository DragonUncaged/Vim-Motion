import type { Lesson } from '../../types';
import { ringBufferCpp } from './source';

export const lesson: Lesson = {
  slug: 'cpp-includes',
  title: 'Include lines',
  module: 'cpp',
  order: 4,
  keys: ['ci"', 'ci<'],
  summary: 'Two include forms, two text objects, and only one of them is the one you know.',
  language: 'cpp',
  explanation: [
    {
      heading: 'Quotes come to you',
      body:
        '[[ci"]] changes what is between the quotes, and it is forgiving: if the cursor is not ' +
        'inside a string, vim takes the next one on the line. So on `#include "engine/frame.h"` ' +
        'you can be anywhere on the line, press [[ci"]], and type the new path.',
    },
    {
      heading: 'Angle brackets do not',
      body:
        '`<...>` is a delimiter pair too, so [[ci<lt>]] works the same way — except it will ' +
        'not go looking. The cursor has to be inside already, so the move is [[f<lt>]] then ' +
        '[[ci<lt>]].',
    },
    {
      heading: 'A header moves and a path grows a directory',
      body: 'None of it is worth a double-click and a drag that takes the quotes with it.',
    },
  ],
  exercises: [
    {
      id: 'move-project-header',
      prompt: '`frame.h` moved into a `media/` directory. Fix the include path.',
      startDoc: ringBufferCpp,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '8G',
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: '#include "engine/media/frame.h"' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'ci"engine/media/frame.h<Esc>',
      par: 24,
      hint: 'No need to move first — [[ci"]] finds the string ahead of the cursor.',
      motions: ['ci"'],
    },
    {
      id: 'vector-to-deque',
      prompt:
        'The buffer is switching from `std::vector` to `std::deque`. Change the include; the ' +
        "member type is somebody else's problem.",
      startDoc: ringBufferCpp,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '6G',
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: '#include <deque>' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'f<lt>ci<lt>deque<Esc>',
      par: 11,
      hint: '[[ci<lt>]] on its own will not find the brackets for you. [[f<lt>]] first.',
      motions: ['ci<', 'f'],
    },
    {
      id: 'both-forms',
      prompt:
        'Two headers at once: `<vector>` becomes `<deque>`, and `"engine/frame.h"` becomes ' +
        '`"engine/packet.h"`.',
      startDoc: ringBufferCpp,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '6G',
      goal: {
        type: 'all',
        goals: [
          {
            type: 'all',
            goals: [
              { type: 'docContains', expected: '#include <deque>' },
              { type: 'docContains', expected: '#include "engine/packet.h"' },
            ],
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'f<lt>ci<lt>deque<Esc>2jci"engine/packet.h<Esc>',
      par: 32,
      hint: 'Angle form first, then two lines down for the quoted one.',
      motions: ['ci<', 'ci"', 'f'],
    },
  ],
};
