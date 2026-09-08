import type { Lesson } from '../../types';

export const lesson: Lesson = {
  slug: 'words',
  title: 'Word motions',
  module: 'basics',
  order: 3,
  keys: ['w', 'e', 'b'],
  summary: 'Stop crawling character by character.',
  language: 'text',
  explanation: [
    {
      heading: 'w e b',
      body:
        '[[w]] jumps to the start of the next word, [[e]] to the end of the one you are on, ' +
        '[[b]] back to the start of the previous. Three keys, and you never press `l` eleven ' +
        'times again.',
    },
    {
      heading: 'w and e are not the same hop',
      body:
        'Reach for [[w]] to **arrive at** something — the next argument, the next identifier. ' +
        'Reach for [[e]] to work on the **end** of a word, because that is where you append.',
    },
    {
      heading: 'A word is smaller than you think',
      body:
        'A run of letters, digits and underscores is one word; a run of punctuation is ' +
        'another. So `total = price` is three words. In code that means `w` takes more hops ' +
        'than you expected — lesson 8 gives you the bigger bite.',
    },
  ],
  exercises: [
    {
      id: 'hop-to-cheese',
      prompt: 'Hop to the word `cheese`.',
      startDoc: 'the quiet cheese slept',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursorOnText', text: 'cheese' },
      solution: 'ww',
      par: 2,
      hint: 'Two hops with `w`.',
      motions: ['w'],
    },
    {
      id: 'land-on-end',
      prompt: 'Land on the last letter of `orbit`.',
      startDoc: 'a small moon in orbit',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursor', line: 0, ch: 20 },
      solution: 'eeee',
      par: 4,
      hint: '`e` lands on word ends, so it walks you straight onto the `t`.',
      motions: ['e'],
    },
    {
      id: 'back-to-never',
      prompt: 'You are at the end of the line. Get back to `never`.',
      startDoc: 'never gonna give you up',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursorOnText', text: 'never' },
      solution: '5b',
      par: 2,
      setupKeys: '$',
      hint: 'Five words back. Counts work here too: `5b`.',
      motions: ['b'],
    },
    {
      id: 'punctuation-costs',
      prompt: 'Land on `qty`, and count how many words vim thinks are in your way.',
      startDoc: 'const total = price * qty;',
      startCursor: { line: 0, ch: 0 },
      goal: { type: 'cursorOnText', text: 'qty' },
      solution: '5w',
      par: 2,
      hint: 'Five, not three: the `=` and the `*` are each a word of their own.',
      motions: ['w'],
    },
  ],
};
