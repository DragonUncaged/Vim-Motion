import type { Lesson } from '../../types';
import { storeGo } from './source';

export const lesson: Lesson = {
  slug: 'go-errs',
  title: 'The if err != nil block',
  module: 'go',
  order: 1,
  keys: ['dap', 'di{'],
  summary: 'The block you delete more than any other, and the two keys that eat it.',
  language: 'go',
  explanation: [
    {
      heading: 'Always the same three lines',
      body:
        'Gofmt writes every error check the same way: `if err != nil {`, a return, a closing ' +
        'brace. Put the cursor anywhere between the braces and [[di{]] takes the body out and ' +
        'leaves the braces standing.',
    },
    {
      heading: 'The call and its check are one paragraph',
      body:
        'Idiomatic Go leaves a blank line after a check, so the call and its check are a ' +
        'single paragraph — the right unit, since if the call goes the check goes with it. ' +
        '[[dap]] from any line in it takes both.',
    },
    {
      heading: 'Why this one first',
      body:
        'Error handling is most of the lines you will ever move in a Go file. This is the one ' +
        'you reach for **forty times before lunch**.',
    },
  ],
  exercises: [
    {
      id: 'gut-first-check',
      prompt:
        'Empty the body of the first `if err != nil` block in `Rotate`. Leave the braces where ' +
        'they are.',
      startDoc: storeGo,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '43G',
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: 'sess, err := s.Get(ctx, id)' },
          { type: 'docExcludes', expected: 'return fmt.Errorf("rotate %s: %w", id, err)' },
          { type: 'docContains', expected: 'token, err := newToken(sess.UserID, now)' },
        ],
      },
      solution: 'di{',
      par: 3,
      hint: '[[di{]] — inner braces. The cursor is already between them.',
      motions: ['di{'],
    },
    {
      id: 'delete-token-call',
      prompt: 'The token no longer rotates. Delete the `newToken` call and the check under it.',
      startDoc: storeGo,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '46G',
      goal: {
        type: 'all',
        goals: [
          { type: 'docExcludes', expected: 'newToken' },
          { type: 'docContains', expected: 'return fmt.Errorf("rotate %s: %w", id, err)' },
          { type: 'docContains', expected: 'sess.Token = token' },
        ],
      },
      solution: 'dap',
      par: 3,
      hint: 'The call and its check are one paragraph. [[dap]] takes a paragraph.',
      motions: ['dap'],
    },
    {
      id: 'gut-ok-guard',
      prompt:
        'Empty the body of the `if !ok` guard in `Get`. The cursor starts on the `if` line, ' +
        'which is not inside the braces yet.',
      startDoc: storeGo,
      startCursor: { line: 0, ch: 0 },
      setupKeys: '34G',
      goal: {
        type: 'all',
        goals: [
          { type: 'docContains', expected: 'sess, ok := s.cache[id]' },
          { type: 'docContains', expected: 'if !ok {' },
          { type: 'docExcludes', expected: 'return nil, ErrNotFound' },
          { type: 'docContains', expected: 'return sess, nil' },
        ],
      },
      solution: '$di{',
      par: 4,
      hint: '`i{` wants the cursor inside the block — or sitting on a brace. [[$]] puts you on the opening one.',
      motions: ['di{', '$'],
    },
  ],
};
