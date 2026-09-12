import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'yank-put',
  title: 'Yank and put',
  module: 'operators',
  order: 3,
  keys: ['yy', 'p', 'P'],
  summary: 'Copy is yank, paste is put, and a yanked line comes back as a whole line.',
  language: 'text',
  explanation: [
    {
      heading: 'Same grammar again',
      body:
        '[[y]] is an operator like [[d]] and [[c]], so [[yw]] yanks a word, [[y$]] to the end ' +
        'of the line, and [[yy]] the whole line. Then [[p]] puts the text after the cursor and ' +
        '[[P]] puts it before.',
    },
    {
      heading: 'Deleting is also copying',
      body:
        'Everything you delete lands in the same unnamed register [[yy]] fills, so **cut and ' +
        'paste is** [[dd]] **then** [[p]]. There is no separate cut key.',
    },
    {
      heading: 'Linewise stays linewise',
      body:
        'A line yanked with [[yy]] comes back as a new line below, not as characters spliced ' +
        'into the middle of the one you are on. A word yanked with [[yw]] comes back as ' +
        'characters.',
    },
  ],
  exercises: [
    {
      id: 'duplicate-line',
      prompt: 'Duplicate the first line so you have a copy to edit.',
      startDoc: 'const primary = "#7B6BF0";\nconst ink = "#241F42";',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'doc',
        expected: 'const primary = "#7B6BF0";\nconst primary = "#7B6BF0";\nconst ink = "#241F42";',
      },
      solution: 'yyp',
      par: 3,
      hint: '[[yy]] then [[p]]. Two commands, three keys.',
      motions: ['yy', 'p'],
    },
    {
      id: 'transpose',
      prompt: 'The `e` and the `h` in `teh` are the wrong way round. Fix it with two keys.',
      startDoc: 'teh quick brown fox',
      startCursor: { line: 0, ch: 1 },
      goal: { type: 'doc', expected: 'the quick brown fox' },
      solution: 'xp',
      par: 2,
      hint: '[[x]] deletes the `e` into the register; [[p]] puts it back on the other side.',
      motions: ['x', 'p'],
    },
    {
      id: 'move-line-to-top',
      prompt: '`bootstrap()` has to run first. Move its line to the top of the file.',
      startDoc: 'alpha();\nbootstrap();\nbeta();',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'doc', expected: 'bootstrap();\nalpha();\nbeta();' },
      solution: 'jddggP',
      par: 6,
      hint: 'Delete it, go where it belongs, and put it **before** the line you are on: [[P]].',
      motions: ['j', 'dd', 'gg', 'P'],
    },
  ],
};
