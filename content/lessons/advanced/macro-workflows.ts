import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'macro-workflows',
  title: 'Macros at scale',
  module: 'advanced',
  order: 2,
  keys: ['@q', '5@q', '@@'],
  summary: 'Record once, then aim it: the count, the stride, and the edits dot cannot reach.',
  language: 'text',
  explanation: [
    {
      heading: 'The count goes on the at-sign',
      body:
        'You recorded it with [[qq]] and you replay it with [[@q]]. Put a number in front — ' +
        '[[7@q]] — and it runs seven times. **Count the rows that are left, not the rows there ' +
        'are:** you already did the first one while you were recording it.',
    },
    {
      heading: 'The last key of the recording is the aim',
      body:
        'A macro has no idea where the next target is. Whatever motion you end the recording ' +
        'with is the stride it will take every time. End on [[j]] and it walks one line; end on ' +
        '[[j]] [[j]] and it walks two, skipping every other line; end on [[n]] and it walks to ' +
        'the next search match instead. Start the recording with [[0]] as well and each run ' +
        'begins from a known column rather than from wherever the last one stopped.',
    },
    {
      heading: 'Where a macro beats the dot',
      body:
        '[[.]] repeats **one** change. The moment the job takes two commands — find the comma, ' +
        'replace it, delete the rest of the line — the dot cannot help and a macro can. Record ' +
        'it slowly, run it once with [[@q]] to check it, and only then reach for a count.',
    },
  ],
  exercises: [
    {
      id: 'count-the-rest',
      prompt:
        'Turn every `name,value` row into `name = value`. Record the first one, then run it on the seven that are left.',
      startDoc: 'alpha,1\nbravo,2\ncharlie,3\ndelta,4\necho,5\nfoxtrot,6\ngolf,7\nhotel,8',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          {
            type: 'doc',
            expected:
              'alpha = 1\nbravo = 2\ncharlie = 3\ndelta = 4\necho = 5\nfoxtrot = 6\ngolf = 7\nhotel = 8',
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'qq0f,s = <Esc>jq7@q',
      par: 16,
      hint: '[[s]] deletes the comma and drops you into insert mode, which is exactly one command instead of two.',
      motions: ['q', '@', 's'],
    },
    {
      id: 'multi-step',
      prompt:
        'Each row is `name,type,unused`. Reshape all three into `name: type` — three commands per row, so the dot is no use here.',
      startDoc: 'id,string,yes\nemail,string,yes\nage,number,no',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          { type: 'doc', expected: 'id: string\nemail: string\nage: number' },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'qqf,s: <Esc>f,Dj0q2@q',
      par: 17,
      hint: 'Land on the first comma, replace it, land on the second, [[D]] the rest away, then step down and back to column zero.',
      motions: ['q', '@', 'D'],
    },
    {
      id: 'stride-of-two',
      prompt: 'Comment out every `key:` line and leave the `value:` lines alone.',
      startDoc: 'key: alpha\nvalue: 1\nkey: beta\nvalue: 2\nkey: gamma\nvalue: 3',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          {
            type: 'doc',
            expected: '# key: alpha\nvalue: 1\n# key: beta\nvalue: 2\n# key: gamma\nvalue: 3',
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'qqI# <Esc>jjq2@q',
      par: 12,
      hint: 'Two [[j]]s at the end of the recording, so every replay skips the line you do not want.',
      motions: ['q', '@', 'I'],
    },
  ],
};
