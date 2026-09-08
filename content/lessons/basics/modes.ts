import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'modes',
  title: 'Modes',
  module: 'basics',
  order: 1,
  keys: ['i', 'Esc'],
  summary: 'Vim has modes. The same key does a different job in each one.',
  language: 'text',
  explanation: [
    {
      heading: 'Why does w do two different things?',
      body:
        'Press [[w]] in a fresh vim and the cursor jumps forward a word. Press it a moment ' +
        'later and a `w` appears in your file. Same key, two outcomes. That is the one idea ' +
        'vim is built on.',
    },
    {
      heading: 'Normal mode is home',
      body:
        'You start in **normal mode** and come back to it constantly. Every key is a command ' +
        'rather than a letter: [[w]] hops forward a word, [[x]] snips a character, [[dd]] ' +
        'deletes a line. Press [[i]] for **insert mode**, where the keyboard behaves like ' +
        'every other editor, and [[<Esc>]] to come home.',
    },
    {
      heading: 'Why bother',
      body:
        'Most of editing is **moving and reshaping** text that already exists. Other editors ' +
        'give that job one key — Ctrl — and run out of room. Vim gives it the whole keyboard, ' +
        'and modes are the rent. When you are lost, press [[<Esc>]].',
    },
  ],
  exercises: [
    {
      id: 'enter-insert',
      prompt: 'Press [[i]] to enter insert mode.',
      startDoc: 'Modes decide what your keys mean.',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'mode', mode: 'insert' },
      solution: 'i',
      par: 1,
      hint: 'One key. `i` stands for insert.',
      motions: ['i'],
    },
    {
      id: 'back-to-normal',
      prompt: 'You are in insert mode. Press [[<Esc>]] to come back to normal mode.',
      startDoc: 'Modes decide what your keys mean.',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'mode', mode: 'normal' },
      solution: '<Esc>',
      par: 1,
      hint: '`<Esc>` always takes you home, from any mode, at any time.',
      setupKeys: 'i',
      motions: ['<Esc>'],
    },
    {
      id: 'insert-word',
      prompt:
        'The cursor sits on `fast`. Press [[i]], type `quiet and ` in front of it, then come ' +
        'back to normal mode.',
      startDoc: 'Normal mode is fast.',
      startCursor: { line: 0, ch: 15 },
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: 'Normal mode is quiet and fast.' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'iquiet and <Esc>',
      par: 12,
      hint: '`i` inserts before the cursor, so you can type straight away. Mind the trailing space.',
      motions: ['i', '<Esc>'],
    },
  ],
};
