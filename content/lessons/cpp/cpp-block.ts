import type { Lesson } from '../../types';
import { ringBufferCpp } from './source';

export const lesson: Lesson = {
  slug: 'cpp-block',
  title: 'Commenting a block',
  module: 'cpp',
  order: 5,
  keys: ['C-v', 'I', 'A'],
  summary: 'Put a `// ` in front of six lines, or a comment behind them, in one edit.',
  language: 'cpp',
  explanation: [
    {
      heading: 'The same rectangle, in a language that indents',
      body:
        'Go had gofmt line the columns up for you; C++ gives you four levels of indent and no ' +
        'two lines the same length. The block still works, because [[I]] inserts at the **left ' +
        'edge of the block**, not the start of each line — put it on the indent and your `// ` ' +
        'lands after it.',
    },
    {
      heading: 'The Esc is the edit',
      body:
        'Type after [[I]] or [[A]] and only the first line changes. The rest are filled in ' +
        'when you press [[<Esc>]] — that keystroke is the edit. Ragged right edges are why ' +
        '[[A]] almost always wants [[$]] in front of it.',
    },
    {
      heading: 'Why you reach for it',
      body:
        'Commenting out four lines to see whether they were the problem costs one block, not ' +
        'four visits. The other classic is [[$]][[A]] with a `;` down a pasted column.',
    },
  ],
  exercises: [
    {
      id: 'comment-push-body',
      prompt: 'Comment out the three statements at the bottom of `push`.',
      startDoc: ringBufferCpp,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '22G^',
      goal: {
        type: 'all',
        goals: [
          {
            type: 'docContains',
            expected:
              '    // data_[head_] = value;\n    // head_ = (head_ + 1) % data_.size();\n' +
              '    // ++size_;',
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: '<C-v>2jI// <Esc>',
      par: 8,
      hint: 'The cursor is on the first non-blank already. [[<C-v>]], down two, [[I]], `// `, [[<Esc>]].',
      motions: ['C-v', 'I'],
    },
    {
      id: 'nolint-members',
      prompt:
        'clang-tidy dislikes all three member names. Append `  // NOLINT` to every one of ' +
        'them at once.',
      startDoc: ringBufferCpp,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '37G^',
      goal: {
        type: 'all',
        goals: [
          {
            type: 'docContains',
            expected:
              '  std::vector<T> data_;  // NOLINT\n  std::size_t head_;  // NOLINT\n' +
              '  std::size_t size_;  // NOLINT',
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: '<C-v>2j$A  // NOLINT<Esc>',
      par: 17,
      hint: 'The three lines end in different columns, so [[$]] before [[A]].',
      motions: ['C-v', 'A', '$'],
    },
    {
      id: 'comment-for-loop',
      prompt: 'Comment out the whole `for` loop in `fill` — header, body and closing brace.',
      startDoc: ringBufferCpp,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '27G',
      goal: {
        type: 'all',
        goals: [
          {
            type: 'docContains',
            expected: '    // for (const T& value : values) {\n    //   push(value);\n    // }',
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'j^<C-v>2jI// <Esc>',
      par: 10,
      hint:
        'Drop onto the `for` line and [[^]] to its first non-blank — that column is the left ' +
        'edge you want, not column zero.',
      motions: ['C-v', 'I', '^'],
    },
  ],
};
