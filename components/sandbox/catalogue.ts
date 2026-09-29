import type { ClayHue } from '@/components/clay/Key';

export interface HelpEntry {
  keys: string[];
  what: string;
  rank: number;
  unit?: string;
}

export type NormalGroupId = 'move' | 'edit' | 'insert' | 'select' | 'find' | 'repeat' | 'screen';

export type VisualGroupId = 'act' | 'grow' | 'shape';

export interface HelpGroupSpec<Id extends string = string> {
  id: Id;
  title: string;
  hue: ClayHue;
  visible: number;
}

export interface Motion {
  keys: string[];
  what: string;
  after: string;
  unit?: string;
  rank: number;
  group: 'move' | 'find';
  charArg?: boolean;
  motionOnly?: boolean;
}

export const MOTIONS: Motion[] = [
  {
    keys: ['w'],
    what: 'to the start of the next word',
    after: 'to the start of the next word',
    unit: 'words',
    rank: 1,
    group: 'move',
  },
  {
    keys: ['b'],
    what: 'back to the start of the word',
    after: 'back to the start of the word',
    unit: 'words',
    rank: 2,
    group: 'move',
  },
  {
    keys: ['e'],
    what: 'to the end of the word',
    after: 'to the end of the word',
    unit: 'words',
    rank: 3,
    group: 'move',
  },
  {
    keys: ['$'],
    what: 'to the end of the line',
    after: 'to the end of the line',
    rank: 4,
    group: 'move',
  },
  {
    keys: ['0'],
    what: 'to the first column',
    after: 'to the first column',
    rank: 5,
    group: 'move',
  },
  {
    keys: ['^'],
    what: 'to the first character that is not a space',
    after: 'to the first character that is not a space',
    rank: 6,
    group: 'move',
  },
  {
    keys: ['j'],
    what: 'down a line, keeping the column',
    after: 'this line and the one below, whole',
    unit: 'lines',
    rank: 7,
    group: 'move',
  },
  {
    keys: ['k'],
    what: 'up a line, keeping the column',
    after: 'this line and the one above, whole',
    unit: 'lines',
    rank: 8,
    group: 'move',
  },
  {
    keys: ['h'],
    what: 'left one character',
    after: 'one character to the left',
    unit: 'characters',
    rank: 9,
    group: 'move',
  },
  {
    keys: ['l'],
    what: 'right one character',
    after: 'one character to the right',
    unit: 'characters',
    rank: 10,
    group: 'move',
  },
  {
    keys: ['}'],
    what: 'down to the next blank line',
    after: 'to the next blank line',
    unit: 'paragraphs',
    rank: 11,
    group: 'move',
  },
  {
    keys: ['{'],
    what: 'up to the previous blank line',
    after: 'back to the previous blank line',
    unit: 'paragraphs',
    rank: 12,
    group: 'move',
  },
  {
    keys: ['G'],
    what: 'to the last line of the file',
    after: 'to the last line, whole lines',
    rank: 13,
    group: 'move',
  },
  {
    keys: ['g', 'g'],
    what: 'to the first line of the file',
    after: 'to the first line, whole lines',
    rank: 14,
    group: 'move',
  },
  {
    keys: ['%'],
    what: 'to the bracket that matches this one',
    after: 'to the matching bracket, brackets included',
    rank: 15,
    group: 'move',
  },
  {
    keys: ['W'],
    what: 'to the next WORD, spaces only',
    after: 'to the next WORD, spaces only',
    unit: 'WORDs',
    rank: 16,
    group: 'move',
  },
  {
    keys: ['B'],
    what: 'back a WORD, spaces only',
    after: 'back a WORD, spaces only',
    unit: 'WORDs',
    rank: 17,
    group: 'move',
  },
  {
    keys: ['E'],
    what: 'to the end of the WORD',
    after: 'to the end of the WORD',
    unit: 'WORDs',
    rank: 18,
    group: 'move',
  },
  {
    keys: [')'],
    what: 'to the next sentence',
    after: 'to the next sentence',
    unit: 'sentences',
    rank: 19,
    group: 'move',
  },
  {
    keys: ['('],
    what: 'back to the previous sentence',
    after: 'back to the previous sentence',
    unit: 'sentences',
    rank: 20,
    group: 'move',
  },
  {
    keys: ['H'],
    what: 'to the top line on screen',
    after: 'to the top line on screen',
    rank: 21,
    group: 'move',
    motionOnly: true,
  },
  {
    keys: ['M'],
    what: 'to the middle line on screen',
    after: 'to the middle line on screen',
    rank: 22,
    group: 'move',
    motionOnly: true,
  },
  {
    keys: ['L'],
    what: 'to the bottom line on screen',
    after: 'to the bottom line on screen',
    rank: 23,
    group: 'move',
    motionOnly: true,
  },

  {
    keys: ['f'],
    what: 'forward onto the next character you type',
    after: 'up to and including the character you type',
    unit: 'matches',
    rank: 1,
    group: 'find',
    charArg: true,
  },
  {
    keys: ['t'],
    what: 'forward to just before the character you type',
    after: 'up to just before the character you type',
    unit: 'matches',
    rank: 2,
    group: 'find',
    charArg: true,
  },
  {
    keys: ['/'],
    what: 'search forward — type a pattern and press Enter',
    after: 'as far as the next match of what you search for',
    rank: 3,
    group: 'find',
  },
  {
    keys: ['n'],
    what: 'to the next match of that search',
    after: 'to the next match of that search',
    unit: 'matches',
    rank: 4,
    group: 'find',
  },
  {
    keys: ['*'],
    what: 'to the next place this same word appears',
    after: 'to the next place this same word appears',
    rank: 5,
    group: 'find',
  },
  {
    keys: ['F'],
    what: 'backward onto the character you type',
    after: 'back to and including the character you type',
    unit: 'matches',
    rank: 6,
    group: 'find',
    charArg: true,
  },
  {
    keys: ['T'],
    what: 'backward to just after the character you type',
    after: 'back to just after the character you type',
    unit: 'matches',
    rank: 7,
    group: 'find',
    charArg: true,
  },
  {
    keys: [';'],
    what: 'repeat that f or t hop forward',
    after: 'repeating the last f or t hop',
    unit: 'hops',
    rank: 8,
    group: 'find',
  },
  {
    keys: [','],
    what: 'repeat that f or t hop the other way',
    after: 'repeating the last f or t hop backwards',
    unit: 'hops',
    rank: 9,
    group: 'find',
  },
  {
    keys: ['?'],
    what: 'search backward — type a pattern and press Enter',
    after: 'back as far as the match of what you search for',
    rank: 10,
    group: 'find',
  },
  {
    keys: ['N'],
    what: 'to the previous match of that search',
    after: 'to the previous match of that search',
    unit: 'matches',
    rank: 11,
    group: 'find',
  },
  {
    keys: ['#'],
    what: 'back to the previous place this word appears',
    after: 'back to the previous place this word appears',
    rank: 12,
    group: 'find',
  },
];

export interface TextObject {
  key: string;
  inner: string;
  around: string;
  rank: number;
}

export const TEXT_OBJECTS: TextObject[] = [
  {
    key: 'w',
    inner: 'the word under the cursor',
    around: 'the word and the space after it',
    rank: 1,
  },
  {
    key: '"',
    inner: 'the double-quoted string, quotes left alone',
    around: 'the string and its quotes',
    rank: 2,
  },
  {
    key: '{',
    inner: 'the braces block, braces left alone',
    around: 'the braces block, braces included',
    rank: 3,
  },
  {
    key: '(',
    inner: 'the parentheses, brackets left alone',
    around: 'the parentheses and their brackets',
    rank: 4,
  },
  {
    key: 'p',
    inner: 'the paragraph',
    around: 'the paragraph and the blank line after it',
    rank: 5,
  },
  {
    key: '[',
    inner: 'the square brackets, brackets left alone',
    around: 'the square brackets, brackets included',
    rank: 6,
  },
  {
    key: "'",
    inner: 'the single-quoted string, quotes left alone',
    around: 'the string and its quotes',
    rank: 7,
  },
  {
    key: 't',
    inner: 'the HTML or JSX tag body',
    around: 'the tag, opening and closing included',
    rank: 8,
  },
  {
    key: '<',
    inner: 'the angle brackets, brackets left alone',
    around: 'the angle brackets, brackets included',
    rank: 9,
  },
  { key: 'W', inner: 'the WORD, spaces only', around: 'the WORD and the space after it', rank: 10 },
  { key: 's', inner: 'the sentence', around: 'the sentence and the space after it', rank: 11 },
  {
    key: '`',
    inner: 'the backtick string, backticks left alone',
    around: 'the string and its backticks',
    rank: 12,
  },
];

export interface Operator {
  keys: string[];
  verb: string;
  what: string;
  doubled: string;
  doubledWhat: string;
  rank: number;
}

export const OPERATORS: Operator[] = [
  {
    keys: ['d'],
    verb: 'delete',
    what: 'delete — then say how much',
    doubled: 'd',
    doubledWhat: 'delete this whole line',
    rank: 1,
  },
  {
    keys: ['c'],
    verb: 'change',
    what: 'change — delete, then drop into insert mode',
    doubled: 'c',
    doubledWhat: 'change this whole line',
    rank: 2,
  },
  {
    keys: ['y'],
    verb: 'yank',
    what: 'yank — copy, without touching the text',
    doubled: 'y',
    doubledWhat: 'yank this whole line',
    rank: 3,
  },
  {
    keys: ['>'],
    verb: 'indent',
    what: 'indent — then say how much',
    doubled: '>',
    doubledWhat: 'indent this line one step',
    rank: 4,
  },
  {
    keys: ['<'],
    verb: 'unindent',
    what: 'unindent — then say how much',
    doubled: '<',
    doubledWhat: 'unindent this line one step',
    rank: 5,
  },
  {
    keys: ['g', 'U'],
    verb: 'uppercase',
    what: 'uppercase — then say how much',
    doubled: 'U',
    doubledWhat: 'uppercase this whole line',
    rank: 6,
  },
  {
    keys: ['g', 'u'],
    verb: 'lowercase',
    what: 'lowercase — then say how much',
    doubled: 'u',
    doubledWhat: 'lowercase this whole line',
    rank: 7,
  },
  {
    keys: ['='],
    verb: 'reindent',
    what: 'reindent — then say how much',
    doubled: '=',
    doubledWhat: 'reindent this whole line',
    rank: 8,
  },
];

export function operatorFor(atoms: string[]): Operator | undefined {
  return OPERATORS.find(
    (op) => op.keys.length === atoms.length && op.keys.every((k, i) => k === atoms[i]),
  );
}

export const NORMAL_GROUPS: HelpGroupSpec<NormalGroupId>[] = [
  { id: 'move', title: 'Move around', hue: 'blue', visible: 6 },
  { id: 'edit', title: 'Change the text', hue: 'coral', visible: 6 },
  { id: 'insert', title: 'Start typing', hue: 'mint', visible: 3 },
  { id: 'select', title: 'Select', hue: 'butter', visible: 3 },
  { id: 'find', title: 'Find and search', hue: 'violet', visible: 5 },
  { id: 'repeat', title: 'Undo and repeat', hue: 'violet', visible: 3 },
  { id: 'screen', title: 'Move the view', hue: 'violet', visible: 3 },
];

export const NORMAL_EXTRAS: Record<Exclude<NormalGroupId, 'move' | 'find'>, HelpEntry[]> = {
  edit: [
    { keys: ['x'], what: 'delete the character under the cursor', rank: 4, unit: 'characters' },
    {
      keys: ['p'],
      what: 'put what you last yanked or deleted after the cursor',
      rank: 5,
      unit: 'copies',
    },
    { keys: ['P'], what: 'put it before the cursor instead', rank: 6, unit: 'copies' },
    { keys: ['s'], what: 'delete this character and start typing', rank: 7 },
    { keys: ['r'], what: 'replace this one character with the next key you press', rank: 8 },
    {
      keys: ['~'],
      what: 'flip the case of this character and move on',
      rank: 9,
      unit: 'characters',
    },
    { keys: ['J'], what: 'join the next line onto this one', rank: 10, unit: 'lines' },
    { keys: ['D'], what: 'delete from here to the end of the line', rank: 11 },
    { keys: ['C'], what: 'change from here to the end of the line', rank: 12 },
    { keys: ['Y'], what: 'yank this whole line', rank: 13 },
  ],
  insert: [
    { keys: ['i'], what: 'insert before the cursor', rank: 1 },
    { keys: ['a'], what: 'insert after the cursor', rank: 2 },
    { keys: ['o'], what: 'open a new line below and start typing', rank: 3 },
    { keys: ['I'], what: 'insert at the first character that is not a space', rank: 4 },
    { keys: ['A'], what: 'insert at the end of the line', rank: 5 },
    { keys: ['O'], what: 'open a new line above and start typing', rank: 6 },
    { keys: ['R'], what: 'replace mode — type over what is already there', rank: 7 },
  ],
  select: [
    { keys: ['v'], what: 'select character by character', rank: 1 },
    { keys: ['V'], what: 'select whole lines', rank: 2 },
    { keys: ['<C-v>'], what: 'select a rectangle — a column across several lines', rank: 3 },
    { keys: ['g', 'v'], what: 'select whatever you had selected last time', rank: 4 },
  ],
  repeat: [
    { keys: ['u'], what: 'undo the last change', rank: 1, unit: 'changes' },
    {
      keys: ['.'],
      what: 'do that last change again, wherever the cursor is now',
      rank: 2,
      unit: 'times',
    },
    { keys: ['<C-r>'], what: 'redo what you just undid', rank: 3, unit: 'changes' },
    { keys: ['q'], what: 'record a macro — press a letter to name it, q again to stop', rank: 4 },
    {
      keys: ['@'],
      what: 'play a macro back — press the letter you recorded it under',
      rank: 5,
      unit: 'times',
    },
    { keys: ['m'], what: 'set a mark here — press a letter to name it', rank: 6 },
    { keys: ['`'], what: 'jump to a mark — press the letter you set', rank: 7 },
    { keys: ['<C-o>'], what: 'go back to where you jumped from', rank: 8, unit: 'jumps' },
    { keys: ['<C-i>'], what: 'go forward again through those jumps', rank: 9, unit: 'jumps' },
  ],
  screen: [
    { keys: ['<C-d>'], what: 'scroll down half a screen', rank: 1 },
    { keys: ['<C-u>'], what: 'scroll up half a screen', rank: 2 },
    { keys: ['z', 'z'], what: 'redraw with this line in the middle of the screen', rank: 3 },
    { keys: ['z', 't'], what: 'redraw with this line at the top', rank: 4 },
    { keys: ['z', 'b'], what: 'redraw with this line at the bottom', rank: 5 },
    { keys: ['<C-e>'], what: 'scroll down one line, cursor stays put', rank: 6, unit: 'lines' },
    { keys: ['<C-y>'], what: 'scroll up one line, cursor stays put', rank: 7, unit: 'lines' },
  ],
};

export const VISUAL_GROUPS: HelpGroupSpec<VisualGroupId>[] = [
  { id: 'act', title: 'Do something to the selection', hue: 'coral', visible: 6 },
  { id: 'grow', title: 'Grow the selection', hue: 'blue', visible: 6 },
  { id: 'shape', title: 'Change the shape of it', hue: 'butter', visible: 4 },
];

export const VISUAL_ACTIONS: HelpEntry[] = [
  { keys: ['d'], what: 'delete the selection', rank: 1 },
  { keys: ['c'], what: 'delete it and start typing in its place', rank: 2 },
  { keys: ['y'], what: 'yank the selection', rank: 3 },
  { keys: ['>'], what: 'indent every selected line one step', rank: 4, unit: 'steps' },
  { keys: ['<'], what: 'unindent every selected line one step', rank: 5, unit: 'steps' },
  { keys: ['p'], what: 'replace the selection with what you last yanked', rank: 6 },
  { keys: ['u'], what: 'lowercase the selection', rank: 7 },
  { keys: ['U'], what: 'uppercase the selection', rank: 8 },
  { keys: ['~'], what: 'flip the case of the selection', rank: 9 },
  { keys: ['J'], what: 'join every selected line into one', rank: 10 },
  { keys: ['='], what: 'reindent the selected lines', rank: 11 },
];

export const VISUAL_SHAPE: HelpEntry[] = [
  { keys: ['o'], what: 'jump to the other end and grow from there instead', rank: 1 },
  { keys: ['<Esc>'], what: 'drop the selection and go back to normal mode', rank: 2 },
  { keys: ['v'], what: 'switch to selecting character by character', rank: 3 },
  { keys: ['V'], what: 'switch to selecting whole lines', rank: 4 },
  { keys: ['<C-v>'], what: 'switch to selecting a rectangle', rank: 5 },
];

export const VISUAL_BLOCK_EXTRAS: HelpEntry[] = [
  { keys: ['I'], what: 'type at the left edge of the block, on every line at once', rank: 1 },
  { keys: ['A'], what: 'type at the right edge of the block, on every line at once', rank: 2 },
  { keys: ['$'], what: 'stretch the block to the end of every line', rank: 3 },
];

export const INSERT_ENTRIES: HelpEntry[] = [
  { keys: ['<Esc>'], what: 'back to normal mode', rank: 1 },
  { keys: ['<C-o>'], what: 'run one normal-mode command and come straight back here', rank: 2 },
  { keys: ['<C-r>'], what: 'paste a register — press the letter, or " for the last yank', rank: 3 },
];

export const REPLACE_ENTRIES: HelpEntry[] = [
  { keys: ['<Esc>'], what: 'back to normal mode', rank: 1 },
  { keys: ['<BS>'], what: 'walk backwards, putting back what you typed over', rank: 2 },
];

export const CHAR_ARG_PROMPTS: Record<string, string> = {
  f: 'Type any character. The cursor lands on the next one of those to the right.',
  F: 'Type any character. The cursor lands on the previous one of those to the left.',
  t: 'Type any character. The cursor stops just before the next one of those.',
  T: 'Type any character. The cursor stops just after the previous one of those.',
  r: 'Type any character. It replaces the one under the cursor, and you stay in normal mode.',
  m: 'Type a letter. This spot is remembered under that letter until you close the tab.',
  '`': 'Type a letter. The cursor jumps to the mark you set with m.',
  "'": 'Type a letter. The cursor jumps to the start of the line holding that mark.',
  q: 'Type a letter to start recording a macro into it. Press q again to stop.',
  '@': 'Type the letter you recorded a macro under, or @ to replay the last one.',
  Z: 'Vim is waiting for a second Z. In a browser there is nothing to write or quit, so press Esc.',
};
