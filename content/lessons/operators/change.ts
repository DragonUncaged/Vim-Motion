import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'change',
  title: 'Change',
  module: 'operators',
  order: 2,
  keys: ['cw', 'cc', 'C'],
  summary: 'c is d that keeps typing. Every d command has a c twin.',
  language: 'text',
  explanation: [
    {
      heading: 'One operator, two jobs',
      body:
        '[[c]] deletes exactly what [[d]] would have deleted, and then leaves you in insert ' +
        'mode with the cursor in the hole. [[cw]], [[c$]], [[cc]], [[ct)]] — if you know the ' +
        'delete, you already know the change.',
    },
    {
      heading: 'Reach for c when you are replacing',
      body:
        'The tell is the word "instead". Deleting a word and then typing a new one is two ' +
        'commands; [[cw]] is one. [[C]] rewrites the tail of a line; [[cc]] rewrites the line ' +
        'but keeps the indent.',
    },
    {
      heading: 'You are still in insert mode',
      body:
        'After a change, keys type letters again until you press [[<Esc>]]. Finish every ' +
        'change with it, the way you finish a sentence with a full stop.',
    },
  ],
  exercises: [
    {
      id: 'change-word',
      prompt: 'Change `slow` to `fast`.',
      startDoc: 'a slow editor',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: 'a fast editor' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'wcwfast<Esc>',
      par: 8,
      hint: '[[w]] onto the word, [[cw]], type, then [[<Esc>]].',
      motions: ['w', 'cw'],
    },
    {
      id: 'change-line',
      prompt: 'The second line is wrong. Rewrite it as `Insert mode is for typing.` with [[cc]].',
      startDoc: 'Normal mode is home.\nInsert mode is for shouting.\nEscape brings you back.',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          {
            type: 'doc',
            expected: 'Normal mode is home.\nInsert mode is for typing.\nEscape brings you back.',
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'jccInsert mode is for typing.<Esc>',
      par: 30,
      hint: '[[cc]] empties the line and drops you straight into insert mode.',
      motions: ['j', 'cc'],
    },
    {
      id: 'change-to-eol',
      prompt: 'The cursor is on the dot. Replace the rest of the line with `.map(toCard);`.',
      startDoc: 'return items.filter(Boolean);',
      startCursor: { line: 0, ch: 0 },
      setupKeys: 'f.',
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: 'return items.map(toCard);' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'C.map(toCard);<Esc>',
      par: 15,
      hint: '[[C]] is `c$` — it clears from the cursor to the end of the line and lets you type.',
      motions: ['C'],
    },
  ],
};
