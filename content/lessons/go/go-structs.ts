import type { Lesson } from '../../types';
import { storeGo } from './source';

export const lesson: Lesson = {
  slug: 'go-structs',
  title: 'Struct literals and signatures',
  module: 'go',
  order: 2,
  keys: ['ci{', 'ci('],
  summary: 'Rewrite a literal body or a parameter list without selecting a thing.',
  language: 'go',
  explanation: [
    {
      heading: 'Braces hold the body',
      body:
        '[[ci{]] changes everything between the nearest pair of braces. On a multi-line ' +
        'composite literal it takes the whole body and drops you on a clean line. You never ' +
        'selected anything and never counted a line.',
    },
    {
      heading: 'Parens hold the arguments',
      body:
        '[[ci(]] does the same for a parameter list or a call. One catch: unlike quotes, `i(` ' +
        'will not go looking — the cursor has to be inside the parens or on one, so [[f(]] ' +
        'first, then [[;]] for the next group.',
    },
    {
      heading: 'Signatures and literals are where Go churns',
      body:
        'A field gets added, a parameter dropped, a `make` loses its size hint. Every one is ' +
        '"replace what is between these delimiters" — a text object, not an edit.',
    },
  ],
  exercises: [
    {
      id: 'rewrite-literal',
      prompt: 'Replace the body of the `&Store{}` literal with a single field, `ttl: ttl,`.',
      startDoc: storeGo,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '27G',
      goal: {
        type: 'all',
        goals: [
          {
            type: 'all',
            goals: [
              { type: 'docContains', expected: 'return &Store{' },
              { type: 'docContains', expected: 'ttl: ttl,' },
              { type: 'docExcludes', expected: 'cache:' },
            ],
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'ci{ttl: ttl,<Esc>',
      par: 13,
      hint: 'The cursor is already inside the braces, so [[ci{]] and type.',
      motions: ['ci{'],
    },
    {
      id: 'shrink-new-signature',
      prompt: '`New` no longer takes a size. Cut its parameter list down to just the ttl.',
      startDoc: storeGo,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '25G',
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: 'func New(ttl time.Duration) *Store {' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'f(ci(ttl time.Duration<Esc>',
      par: 23,
      hint: '[[f(]] to get inside the parens, then [[ci(]].',
      motions: ['ci(', 'f'],
    },
    {
      id: 'comma-ok-return',
      prompt:
        "A miss is not an error, it is a miss. Change `Get`'s **return** list to " +
        '`(*Session, bool)`.',
      startDoc: storeGo,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '32G',
      goal: {
        type: 'all',
        goals: [
          {
            type: 'docContains',
            expected: 'func (s *Store) Get(ctx context.Context, id string) (*Session, bool) {',
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'f(;;ci(*Session, bool<Esc>',
      par: 22,
      hint:
        'Three paren groups on that line: the receiver, the parameters, the returns. [[f(]] ' +
        'lands on the first and [[;]] walks the rest.',
      motions: ['ci(', 'f', ';'],
    },
  ],
};
