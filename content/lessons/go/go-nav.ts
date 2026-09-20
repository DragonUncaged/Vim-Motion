import type { Lesson } from '../../types';
import { storeGo } from './source';

export const lesson: Lesson = {
  slug: 'go-nav',
  title: 'Moving between declarations',
  module: 'go',
  order: 3,
  keys: ['}', '{', 'dap'],
  summary:
    'Gofmt puts a blank line between declarations, so paragraph motions are declaration motions.',
  language: 'go',
  explanation: [
    {
      heading: 'A paragraph is a declaration',
      body:
        "In a gofmt'd file a paragraph is a declaration: an import block, a var, a type, a " +
        'func. So [[}]] and [[{]] walk the file one declaration at a time. They land **on** ' +
        'the blank line between, so the last step is one [[j]].',
    },
    {
      heading: 'dap eats a whole func',
      body:
        'A short func with no blank lines inside is one paragraph, and [[dap]] deletes it and ' +
        'the blank line after. A longer func is several paragraphs — `Rotate` is three — so ' +
        'there [[dap]] takes a stanza, not the function.',
    },
    {
      heading: 'Because the alternative is scrolling',
      body:
        'Two or three [[}]] taps cross a file faster than your eye finds the declaration, and ' +
        'they cost no thought: gofmt already put the breaks in the right places.',
    },
  ],
  exercises: [
    {
      id: 'hop-to-session',
      prompt: 'Get to the `Session` struct declaration using paragraph hops.',
      startDoc: storeGo,
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursorOnText', text: 'type Session struct' },
      solution: '}}}j',
      par: 4,
      hint: '[[}]] lands on the blank line between declarations, so finish with one [[j]].',
      motions: ['}', 'j'],
    },
    {
      id: 'hop-back-to-get',
      prompt: 'You are at the bottom of the file. Walk back up to the `Get` method.',
      startDoc: storeGo,
      startCursor: { line: 0, ch: 0 },
      setupKeys: 'G',
      goal: { type: 'cursorOnText', text: 'func (s *Store) Get' },
      solution: '{{{{j',
      par: 5,
      hint: '[[{]] is [[}]] in reverse. `Rotate` has blank lines inside it, so it costs more than one hop.',
      motions: ['{', 'j'],
    },
    {
      id: 'delete-get',
      prompt: 'Delete the whole `Get` method.',
      startDoc: storeGo,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '32G',
      goal: {
        type: 'all',
        goals: [
          { type: 'docExcludes', expected: 'sess, ok := s.cache[id]' },
          { type: 'docContains', expected: 'func New(ttl time.Duration, size int) *Store {' },
          { type: 'docContains', expected: 'func (s *Store) Rotate' },
        ],
      },
      solution: 'dap',
      par: 3,
      hint: 'No blank lines inside it, so the whole method is one paragraph.',
      motions: ['dap'],
    },
    {
      id: 'hop-and-delete-new',
      prompt: 'Hop down to the `New` constructor and delete it — no search, no line numbers.',
      startDoc: storeGo,
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'docExcludes', expected: 'func New(' },
          { type: 'docContains', expected: 'type Store struct {' },
          { type: 'docContains', expected: 'func (s *Store) Get' },
        ],
      },
      solution: '}}}}}jdap',
      par: 9,
      hint: 'Five declarations sit above `New`. Count the blank lines, then [[j]][[dap]].',
      motions: ['}', 'dap'],
    },
  ],
};
