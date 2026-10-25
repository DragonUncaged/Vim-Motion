import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'registers',
  title: 'Named registers',
  module: 'advanced',
  order: 1,
  keys: ['"a', '"A', '"0', '<C-r>'],
  summary: 'Twenty-six clipboards, the one a delete cannot steal, and a way in from insert mode.',
  language: 'text',
  explanation: [
    {
      heading: 'Every yank has an address',
      body:
        'You already know that [[yy]] and [[dd]] both fill the same unnamed register. Prefix ' +
        'either with a register name and the text goes somewhere of its own instead: ' +
        '[["ayy]] yanks the line into `a`, [["ap]] puts it back. Twenty-six letters, so you can ' +
        'carry twenty-six things at once and lay them down in whatever order you like.',
    },
    {
      heading: 'A capital letter appends',
      body:
        '[["Ayy]] adds the line to whatever `a` already holds rather than replacing it. That is ' +
        'the whole technique: walk the file, tap [["Ayy]] on each line worth keeping, then ' +
        '[["ap]] them all down together in one go. **Lower case overwrites, upper case appends** ' +
        '— the same rule for every letter.',
    },
    {
      heading: 'Register 0 is the yank you did not lose',
      body:
        'Delete something and it lands in the unnamed register, on top of the yank you were ' +
        'saving. Vim keeps the last **yank** separately in `0`, so [["0p]] still has it. This is ' +
        'the answer to "I copied a line, deleted another line, and my copy is gone". Deletes ' +
        'stack up in `1` to `9` the same way.',
    },
    {
      heading: 'And you can reach one from insert mode',
      body:
        'Halfway through typing a line and you need something you yanked earlier: [[<C-r>]] ' +
        'then the register letter drops it in **without leaving insert mode**. [[<C-r>0]] for ' +
        'the last yank, [[<C-r>a]] for register `a`. It saves the whole dance of [[<Esc>]], ' +
        'finding your place again, putting, and getting back to where you were typing.',
    },
  ],
  exercises: [
    {
      id: 'two-registers',
      prompt:
        'Only the port and the host belong in the summary. Carry one in `a` and one in `b`, then lay both under `summary:`.',
      startDoc: 'port: 8080\nworkers: 4\nlog_level: info\nhost: localhost\n\nsummary:',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          {
            type: 'doc',
            expected:
              'port: 8080\nworkers: 4\nlog_level: info\nhost: localhost\n\nsummary:\nport: 8080\nhost: localhost',
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: '"ayy3j"byyG"ap"bp',
      par: 17,
      hint: 'One register cannot hold two lines in the order you want them. Use two.',
      motions: ['"a', 'yy', 'p'],
    },
    {
      id: 'append-with-capital-a',
      prompt:
        'Collect the three `fix:` lines into register `a` with [["A]], then put them under `Fixes:`.',
      startDoc:
        'fix: retry on 429\nchore: bump deps\nfix: clamp the timeout\nchore: tidy imports\nfix: guard the nil map\n\nFixes:',
      startCursor: { line: 0, ch: 0 },
      goal: {
        type: 'all',
        goals: [
          {
            type: 'register',
            name: 'a',
            expected: 'fix: retry on 429\nfix: clamp the timeout\nfix: guard the nil map\n',
          },
          {
            type: 'doc',
            expected:
              'fix: retry on 429\nchore: bump deps\nfix: clamp the timeout\nchore: tidy imports\n' +
              'fix: guard the nil map\n\nFixes:\nfix: retry on 429\nfix: clamp the timeout\nfix: guard the nil map',
          },
        ],
      },
      solution: '"ayyjj"Ayyjj"AyyG"ap',
      par: 20,
      hint: 'First one with [["ayy]] to start the pile, the other two with [["Ayy]] to add to it.',
      motions: ['"A', 'yy', 'p'],
    },
    {
      id: 'yank-register',
      prompt:
        'You yanked the primary colour, then deleted the dead line — so [[p]] would give you the dead line back. Put the yank at the bottom instead.',
      startDoc: 'const primary = "#7B6BF0";\nconst legacy = "#CCCCCC";\nconst accent = "";',
      startCursor: { line: 0, ch: 0 },
      setupKeys: 'yyjdd',
      goal: {
        type: 'all',
        goals: [
          {
            type: 'doc',
            expected: 'const primary = "#7B6BF0";\nconst accent = "";\nconst primary = "#7B6BF0";',
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: '"0p',
      par: 3,
      hint: 'The delete overwrote the unnamed register. The yank is still in `0`.',
      motions: ['"0', 'p'],
    },
    {
      id: 'paste-without-leaving-insert',
      prompt:
        'The type name is already in register `t`. Finish the signature with [[<C-r>t]] rather than leaving insert mode to fetch it.',
      startDoc: 'type Session = {\n  id: string;\n};\n\nfunction load(): ',
      startCursor: { line: 0, ch: 0 },
      setupKeys: 'w"tyiw',
      goal: {
        type: 'all',
        goals: [
          {
            type: 'doc',
            expected: 'type Session = {\n  id: string;\n};\n\nfunction load(): Session {}',
          },
          { type: 'mode', mode: 'normal' },
        ],
      },
      solution: 'GA<C-r>t {}<Esc>',
      par: 8,
      hint: '[[G]] [[A]] to get typing, then [[<C-r>]] and the register letter — no [[<Esc>]] in the middle.',
      motions: ['<C-r>', 'A'],
    },
  ],
};
