import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'search',
  title: 'Search',
  module: 'operators',
  order: 7,
  keys: ['/', '?', 'n', 'N', '*', '#'],
  summary: 'The fastest motion in the editor is the one that reads.',
  language: 'text',
  explanation: [
    {
      heading: 'Type what you can see',
      body:
        '[[/]] opens a prompt, you type a pattern, [[<CR>]] jumps to the next match; [[?]] ' +
        'goes backwards. [[n]] and [[N]] repeat it, so you can walk every match with one finger.',
    },
    {
      heading: 'Star is the one you will love',
      body:
        '[[*]] searches for the word already under the cursor; [[#]] goes backwards. Stand on ' +
        'a variable name, tap [[*]], and you are walking every use of it without typing the ' +
        'name — vim\'s "find all references", in a plain text file.',
    },
    {
      heading: 'Search is a motion, so it takes an operator',
      body:
        'Because [[/]] is a motion, [[d/return<CR>]] deletes from the cursor to the next ' +
        '`return`. That is why search belongs in a lesson about operators.',
    },
  ],
  exercises: [
    {
      id: 'search-forward',
      prompt: 'Search for `save` and land on it.',
      startDoc: 'const habit = load();\nrender(card);\nsave(habit);\nreport(habit);',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursorOnText', text: 'save' },
      solution: '/save<CR>',
      par: 6,
      hint: '[[/]] then the word then [[<CR>]].',
      motions: ['/'],
    },
    {
      id: 'star',
      prompt: 'The cursor is on `habit`. Walk to its next use without typing the name.',
      startDoc: 'const habit = load();\nrender(card);\nsave(habit);\nreport(habit);',
      startCursor: { line: 0, ch: 0 },
      setupKeys: 'w',
      goal: { type: 'cursorOnText', text: 'habit', occurrence: 1 },
      solution: '*',
      par: 1,
      hint: 'One key: [[*]] searches for the word under the cursor.',
      motions: ['*'],
    },
    {
      id: 'search-repeat',
      prompt: 'Search for `habit` and then use [[n]] to reach the last one on line 4.',
      startDoc: 'const habit = load();\nrender(card);\nsave(habit);\nreport(habit);',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursorOnText', text: 'habit', occurrence: 2 },
      solution: '/habit<CR>nn',
      par: 9,
      hint: 'The search lands on the first match; each [[n]] steps to the next.',
      motions: ['/', 'n'],
    },
    {
      id: 'hash-backwards',
      prompt: 'You are on the last `habit`. Walk backwards to the one before it.',
      startDoc: 'const habit = load();\nrender(card);\nsave(habit);\nreport(habit);',
      startCursor: { line: 0, ch: 0 },
      setupKeys: 'Gfh',
      goal: { type: 'cursorOnText', text: 'habit', occurrence: 1 },
      solution: '#',
      par: 1,
      hint: '[[#]] is [[*]] pointed the other way.',
      motions: ['#'],
    },
  ],
};
