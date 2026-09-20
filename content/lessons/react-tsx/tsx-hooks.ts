import type { Lesson } from '../../types';
import { habitCard } from './habit-card';

export const lesson: Lesson = {
  slug: 'tsx-hooks',
  title: 'Hooks and brackets',
  module: 'react-tsx',
  order: 3,
  keys: ['vi{', 'vi[', '%'],
  summary: 'Dependency arrays, hook bodies, and the bracket that closes forty lines of markup.',
  language: 'tsx',
  explanation: [
    {
      heading: 'Select first, decide second',
      body:
        '[[vi[]] selects what is inside the nearest square brackets; [[vi{]] does the same for ' +
        'braces. Same objects as [[ci{]], but you see the highlight before you commit. Then ' +
        'press `y`, `d`, `c`, or [[<Esc>]] to back out.',
    },
    {
      heading: 'Percent bounces, but only over real brackets',
      body:
        '[[%]] jumps from a bracket to the one that closes it, and back. On a `useEffect` that ' +
        'is `=> {` to `}, [deps]`; in JSX it is the `(` after `return` to the `)` at the bottom ' +
        'of the component. It matches `()`, `[]` and `{}` and **nothing else** — not `<div>` ' +
        'with `</div>`, here or in real vim. For tags, use [[f<lt>]] and [[t>]] next lesson.',
    },
    {
      heading: 'See the edit before you make it',
      body:
        'A dependency array is what you edit most often and read least carefully. And [[%]] ' +
        'tells you whether the brace on line 41 belongs to the hook or the component.',
    },
  ],
  exercises: [
    {
      id: 'bounce-jsx',
      prompt: 'From the `(` after `return`, jump to the paren that closes the whole component.',
      startDoc: habitCard,
      startCursor: { line: 28, ch: 9 },
      goal: { type: 'cursor', line: 41, ch: 2 },
      solution: '%',
      par: 1,
      hint: 'One key. [[%]] does not care how much markup is in between.',
      motions: ['%'],
    },
    {
      id: 'yank-deps',
      prompt: "Select the `toggle` callback's dependency array and yank it.",
      startDoc: habitCard,
      startCursor: { line: 26, ch: 2 },
      goal: { type: 'register', name: '"', expected: 'onToggle, habit.id, habit.done' },
      solution: 'f[vi[y',
      par: 6,
      hint: '[[f[]] to reach the bracket, [[vi[]] to select what is inside it, then `y`.',
      motions: ['vi[', 'y', 'f'],
    },
    {
      id: 'select-label',
      prompt: "Select the button's label expression — the ternary — and yank it.",
      startDoc: habitCard,
      startCursor: { line: 38, ch: 8 },
      goal: { type: 'register', name: '"', expected: 'habit.done ? "Done" : "Mark done"' },
      solution: 'vi{y',
      par: 4,
      hint: 'The cursor is already on the brace, so [[vi{]] selects straight away.',
      motions: ['vi{', 'y'],
    },
    {
      id: 'bounce-then-empty',
      prompt: 'Bounce to the end of the flash effect, then empty its dependency array.',
      startDoc: habitCard,
      startCursor: { line: 16, ch: 18 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: '}, []);' },
          { type: 'docContains', expected: '}, [habit.streak]);' },
        ],
      },
      solution: '%f[vi[d',
      par: 7,
      hint: '[[%]] puts you on the closing brace of the hook, which is the same line as its deps.',
      motions: ['%', 'vi[', 'f'],
    },
  ],
};
