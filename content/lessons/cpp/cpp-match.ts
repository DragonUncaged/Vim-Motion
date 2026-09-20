import type { Lesson } from '../../types';
import { ringBufferCpp } from './source';

export const lesson: Lesson = {
  slug: 'cpp-match',
  title: 'Matching brackets',
  module: 'cpp',
  order: 1,
  keys: ['%'],
  summary: 'One key to the other end of the block. In C++ that is navigation, not a party trick.',
  language: 'cpp',
  explanation: [
    {
      heading: 'Bounce to the mate',
      body:
        'Put the cursor on any bracket and [[%]] jumps to the one that closes it; press it ' +
        'again and you are back. Off a bracket, it takes the first one to its right on the line.',
    },
    {
      heading: 'It is a motion, so operators take it',
      body:
        '[[d%]] deletes from here to the matching bracket, inclusive — from the opening brace ' +
        'of a member function, the whole body in two keys. [[y%]] yanks it, [[c%]] replaces it.',
    },
    {
      heading: 'Where does this end?',
      body:
        'A C++ class body is longer than a screen. [[%]] answers "where does this end" without ' +
        'scrolling, and tells you when the answer is not where you thought.',
    },
  ],
  exercises: [
    {
      id: 'class-end',
      prompt: 'Jump from the opening brace of `class RingBuffer` to the brace that closes it.',
      startDoc: ringBufferCpp,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '13G$',
      goal: { type: 'cursor', line: 39, ch: 0 },
      solution: '%',
      par: 1,
      hint: 'One key.',
      motions: ['%'],
    },
    {
      id: 'paren-mate',
      prompt: 'Land on the closing paren of `(head_ + 1)`.',
      startDoc: ringBufferCpp,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '23G',
      goal: { type: 'cursor', line: 22, ch: 22 },
      solution: 'f(%',
      par: 3,
      hint:
        'The `%` further along that line is the modulo operator, not a bracket. [[f(]] first, ' +
        'then [[%]].',
      motions: ['%', 'f'],
    },
    {
      id: 'delete-push-body',
      prompt: 'Delete the whole body of `push`, braces and all, leaving its signature behind.',
      startDoc: ringBufferCpp,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '18G$',
      goal: {
        type: 'all',
        goals: [
          { type: 'docExcludes', expected: 'ring buffer is full' },
          { type: 'docExcludes', expected: '++size_;' },
          { type: 'docContains', expected: 'void push(const T& value)' },
          { type: 'docContains', expected: 'void fill(const std::vector<T>& values) {' },
        ],
      },
      solution: 'd%',
      par: 2,
      hint: '[[%]] is a motion, and [[d]] takes motions.',
      motions: ['d%', '%'],
    },
  ],
};
