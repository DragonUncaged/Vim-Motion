import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'undo-repeat',
  title: 'Undo and repeat',
  module: 'operators',
  order: 10,
  keys: ['u', '<C-r>', '.'],
  summary: 'u takes it back, Ctrl+r puts it back, and . is the second-biggest idea in vim.',
  language: 'text',
  explanation: [
    {
      heading: 'Undo is per change, not per keystroke',
      body:
        '[[u]] undoes one whole change — a [[dd]], a [[ciw]] and everything you typed inside ' +
        'it. [[<C-r>]] redoes it. The unit is the change, not the keystroke.',
    },
    {
      heading: 'The dot repeats your last change',
      body:
        'Press [[.]] and vim does the last change again, wherever the cursor is now. Three ' +
        'lines needing the same edit cost one edit and two dots.',
    },
    {
      heading: 'Make the change repeatable',
      body:
        'Ask whether the change will still make sense one line down. [[A;]] and [[ciw]] repeat ' +
        'well because they carry their own aim; [[xxx]] does not, because [[.]] repeats only ' +
        'the last [[x]]. **Prefer one change over three.**',
    },
  ],
  exercises: [
    {
      id: 'undo',
      prompt: 'You just deleted the wrong line. Put it back.',
      startDoc: 'const primary = "#7B6BF0";\nconst ink = "#241F42";',
      startCursor: { line: 0, ch: 0 },
      setupKeys: 'dd',
      goal: {
        type: 'doc',
        expected: 'const primary = "#7B6BF0";\nconst ink = "#241F42";',
      },
      solution: 'u',
      par: 1,
      hint: 'One key: [[u]].',
      motions: ['u'],
    },
    {
      id: 'redo',
      prompt: 'You undid one step too far — that line really did have to go. Redo the delete.',
      startDoc: 'const primary = "#7B6BF0";\nconst ink = "#241F42";',
      startCursor: { line: 0, ch: 0 },
      setupKeys: 'ddu',
      goal: { type: 'doc', expected: 'const ink = "#241F42";' },
      solution: '<C-r>',
      par: 1,
      hint: '[[<C-r>]] walks forward through the same history [[u]] walks back through.',
      motions: ['<C-r>'],
    },
    {
      id: 'dot-repeat',
      prompt:
        'All three lines are missing a semicolon. Add the first one yourself, then let [[.]] do the other two.',
      startDoc: 'console.log("a")\nconsole.log("b")\nconsole.log("c")',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          {
            type: 'doc',
            expected: 'console.log("a");\nconsole.log("b");\nconsole.log("c");',
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'A;<Esc>j.j.',
      par: 7,
      hint: '[[A]] appends at the end of the line, so the change aims itself. Then [[j]] [[.]] twice.',
      motions: ['.', 'A'],
    },
  ],
};
