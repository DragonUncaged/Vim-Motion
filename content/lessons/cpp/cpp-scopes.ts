import type { Lesson } from '../../types';
import { ringBufferCpp } from './source';

export const lesson: Lesson = {
  slug: 'cpp-scopes',
  title: 'Loop bodies and scopes',
  module: 'cpp',
  order: 2,
  keys: ['di{', 'da{'],
  summary: 'Inner guts the body. Around takes the braces too. Know which one you meant.',
  language: 'cpp',
  explanation: [
    {
      heading: 'Inner keeps the braces',
      body:
        '[[di{]] deletes everything **between** the braces and leaves them standing, which is ' +
        'what you want when the loop stays and its body changes. The cursor can be anywhere ' +
        'inside the block.',
    },
    {
      heading: 'Around takes them too',
      body:
        '[[da{]] deletes the braces as well. On a guard clause that leaves the `if (...)` line ' +
        'dangling, until you follow it with [[dd]] and the guard is gone.',
    },
    {
      heading: 'C++ nests, and counting lines does not scale',
      body:
        'A body inside a loop inside a method inside a class, and the closing brace you care ' +
        'about is eleven lines away with three others between. Text objects find it; counting ' +
        'lines does not.',
    },
  ],
  exercises: [
    {
      id: 'gut-for-body',
      prompt: 'Empty the body of the `for` loop in `fill`, keeping the loop itself.',
      startDoc: ringBufferCpp,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '29G',
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: 'void fill(const std::vector<T>& values) {' },
          { type: 'docContains', expected: 'for (const T& value : values) {' },
          { type: 'docExcludes', expected: 'push(value);' },
        ],
      },
      solution: 'di{',
      par: 3,
      hint: '[[di{]] from inside the loop body.',
      motions: ['di{'],
    },
    {
      id: 'strip-guard-braces',
      prompt:
        'Take the braces and the throw out of the capacity guard in `push`, leaving the `if` ' +
        'line behind.',
      startDoc: ringBufferCpp,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '20G',
      goal: {
        type: 'all',
        goals: [
          { type: 'docExcludes', expected: 'ring buffer is full' },
          { type: 'docContains', expected: 'if (size_ == data_.size())' },
          { type: 'docContains', expected: 'data_[head_] = value;' },
        ],
      },
      solution: 'da{',
      par: 3,
      hint: 'Around, not inner. [[da{]].',
      motions: ['da{'],
    },
    {
      id: 'remove-guard',
      prompt: '`push` should never throw. Remove the capacity guard entirely.',
      startDoc: ringBufferCpp,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '20G',
      goal: {
        type: 'all',
        goals: [
          { type: 'docExcludes', expected: 'ring buffer is full' },
          { type: 'docExcludes', expected: 'if (size_ ==' },
          { type: 'docContains', expected: 'void push(const T& value) {' },
          { type: 'docContains', expected: 'data_[head_] = value;' },
        ],
      },
      solution: 'da{dd',
      par: 5,
      hint: '[[da{]] leaves the `if` line with nothing after it. [[dd]] finishes the job.',
      motions: ['da{', 'dd'],
    },
  ],
};
