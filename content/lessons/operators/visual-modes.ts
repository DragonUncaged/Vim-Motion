import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'visual-modes',
  title: 'Visual modes',
  module: 'operators',
  order: 9,
  keys: ['v', 'V', '<C-v>', 'o'],
  summary: 'Select first, look at it, then act. And one mode that edits a column.',
  language: 'text',
  explanation: [
    {
      heading: 'Three flavours of selection',
      body:
        '[[v]] selects characters, [[V]] whole lines, [[<C-v>]] a **rectangle** of columns ' +
        'across several lines. Move to grow the selection, then press an operator. Text ' +
        'objects work here too: [[vi{]] highlights a block before you decide.',
    },
    {
      heading: 'o fixes the end you got wrong',
      body:
        'Halfway through a selection you realise it needed to start earlier. [[o]] hops to the ' +
        '**other** end so you can extend backwards, then hops back.',
    },
    {
      heading: 'Block mode is the party trick',
      body:
        'Cursor at column zero, [[<C-v>]], down a few lines, [[I]], type `// `, [[<Esc>]] — ' +
        'every line in the block gets the comment at once. [[A]] does the same at the end.',
    },
  ],
  exercises: [
    {
      id: 'visual-line',
      prompt: 'Select the three debug lines with [[V]] and delete them.',
      startDoc:
        'export function Card() {\n  console.log("debug 1");\n  console.log("debug 2");\n  console.log("debug 3");\n  return null;\n}',
      startCursor: { line: 1, ch: 2 },
      goal: { type: 'doc', expected: 'export function Card() {\n  return null;\n}' },
      solution: 'Vjjd',
      par: 4,
      hint: '[[V]] takes the whole line, so the column you start in does not matter.',
      motions: ['V'],
    },
    {
      id: 'visual-other-end',
      prompt:
        'The cursor is on `and`. Select it, then use [[o]] to extend backwards over `moving ` too, and delete both words.',
      startDoc: 'Vim gives the whole keyboard to moving and reshaping text.',
      startCursor: { line: 0, ch: 0 },
      setupKeys: '7w',
      goal: {
        type: 'doc',
        expected: 'Vim gives the whole keyboard to reshaping text.',
      },
      solution: 'veobhd',
      par: 6,
      hint: '[[v]] [[e]] selects `and`; [[o]] jumps to the front of it; [[b]] and [[h]] reach back past `moving`.',
      motions: ['v', 'o'],
    },
    {
      id: 'visual-block-comment',
      prompt: 'Comment out all three lines at once with a block selection.',
      startDoc: 'alpha();\nbeta();\ngamma();',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: '// alpha();\n// beta();\n// gamma();' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: '<C-v>jjI//<Space><Esc>',
      par: 8,
      hint: '[[<C-v>]], down twice, [[I]], type the comment marker, then [[<Esc>]] to copy it down.',
      motions: ['<C-v>', 'I'],
    },
  ],
};
