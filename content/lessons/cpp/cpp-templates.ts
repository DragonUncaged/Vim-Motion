import type { Lesson } from '../../types';
import { ringBufferCpp } from './source';

export const lesson: Lesson = {
  slug: 'cpp-templates',
  title: 'Template parameter lists',
  module: 'cpp',
  order: 3,
  keys: ['f<', 'ci<'],
  summary: '`std::vector<T>` becomes `std::vector<U>` without touching either bracket.',
  language: 'cpp',
  explanation: [
    {
      heading: 'Angle brackets are a text object',
      body:
        'Vim treats `<` and `>` as a delimiter pair like any other, so [[ci<lt>]] changes ' +
        'whatever sits between them. `RingBuffer<Frame>` becomes `RingBuffer<Packet>` without ' +
        'you touching either bracket.',
    },
    {
      heading: 'Get inside first',
      body:
        'Angle brackets do not search forward the way quotes do. The cursor has to be inside ' +
        'the pair or on one of them, so the move is [[f<lt>]] then [[ci<lt>]].',
    },
    {
      heading: 'The argument, not the name',
      body:
        'What you want to change in a template is almost always the argument, not the name. ' +
        'And to *add* one, [[f>]] and type — fewer keys than [[ci<lt>]] and a retype.',
    },
  ],
  exercises: [
    {
      id: 'swap-alias-arg',
      prompt: 'The ring holds packets now. Change the `FrameRing` alias to `RingBuffer<Packet>`.',
      startDoc: ringBufferCpp,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '42G',
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: 'using FrameRing = RingBuffer<Packet>;' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'f<lt>ci<lt>Packet<Esc>',
      par: 12,
      hint: '[[f<lt>]] to reach the bracket, [[ci<lt>]] to replace what is inside it.',
      motions: ['ci<', 'f'],
    },
    {
      id: 'typename-to-class',
      prompt: 'House style says `class`, not `typename`. Rewrite the template parameter list.',
      startDoc: ringBufferCpp,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '12G',
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: 'template <class T>' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'f<lt>ci<lt>class T<Esc>',
      par: 13,
      hint: 'Same two moves as before, one line up from the class.',
      motions: ['ci<', 'f'],
    },
    {
      id: 'add-allocator',
      prompt:
        'Add a second template parameter, `typename Alloc`, after `T` — without retyping `T`.',
      startDoc: ringBufferCpp,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '12G',
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: 'template <typename T, typename Alloc>' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'f>i, typename Alloc<Esc>',
      par: 20,
      hint:
        'You are adding, not replacing. Land on the `>` with [[f>]] and [[i]] types in front ' +
        'of it.',
      motions: ['f', 'i'],
    },
  ],
};
