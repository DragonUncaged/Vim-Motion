/** Parses EditorSnapshot.pendingKeys (docs/CONTRACT.md §11); anything unexplained resolves to unknown. */

import type { ClayHue } from '@/components/clay/Key';
import type { EditorMode } from '@/lib/engine';
import {
  CHAR_ARG_PROMPTS,
  INSERT_ENTRIES,
  MOTIONS,
  NORMAL_EXTRAS,
  NORMAL_GROUPS,
  OPERATORS,
  REPLACE_ENTRIES,
  TEXT_OBJECTS,
  VISUAL_ACTIONS,
  VISUAL_BLOCK_EXTRAS,
  VISUAL_GROUPS,
  VISUAL_SHAPE,
  operatorFor,
  type HelpEntry,
  type NormalGroupId,
  type VisualGroupId,
} from './catalogue';

export interface ParsedPending {
  raw: string;
  register: string | null;
  registerPending: boolean;
  count: number | null;
  atoms: string[];
  charArgFor: string | null;
}

const EMPTY_PARSE: ParsedPending = {
  raw: '',
  register: null,
  registerPending: false,
  count: null,
  atoms: [],
  charArgFor: null,
};

export function parsePending(raw: string): ParsedPending {
  if (raw === '') return EMPTY_PARSE;

  let i = 0;
  let register: string | null = null;
  if (raw.startsWith('"')) {
    if (raw.length === 1) {
      return { ...EMPTY_PARSE, raw, registerPending: true };
    }
    register = raw.charAt(1);
    i = 2;
  }

  const atoms: string[] = [];
  const runs: number[] = [];
  let digits = '';
  let charArgFor: string | null = null;

  for (; i < raw.length; i++) {
    const ch = raw.charAt(i);

    if (charArgFor !== null) {
      atoms.push(ch);
      charArgFor = null;
      continue;
    }

    if (ch >= '0' && ch <= '9' && !(ch === '0' && digits === '')) {
      digits += ch;
      continue;
    }
    if (digits !== '') {
      runs.push(parseInt(digits, 10));
      digits = '';
    }

    atoms.push(ch);
    if (Object.prototype.hasOwnProperty.call(CHAR_ARG_PROMPTS, ch)) charArgFor = ch;
  }
  if (digits !== '') runs.push(parseInt(digits, 10));

  const count = runs.length === 0 ? null : runs.reduce((a, b) => a * b, 1);
  return { raw, register, registerPending: false, count, atoms, charArgFor };
}

export interface ResolvedGroup {
  id: string;
  title: string;
  hue: ClayHue;
  visible: number;
  entries: HelpEntry[];
}

export interface HelpView {
  title: string;
  note: string | null;
  typed: string[];
  typedLen: number;
  count: number | null;
  register: string | null;
  groups: ResolvedGroup[];
  unknown: boolean;
}

const sortRank = (a: HelpEntry, b: HelpEntry): number => a.rank - b.rank;

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function normalMotionEntries(group: 'move' | 'find'): HelpEntry[] {
  return MOTIONS.filter((m) => m.group === group).map((m) => ({
    keys: m.keys,
    what: m.what,
    rank: m.rank,
    unit: m.unit,
  }));
}

function normalView(): ResolvedGroup[] {
  const byId: Record<NormalGroupId, HelpEntry[]> = {
    move: normalMotionEntries('move'),
    find: normalMotionEntries('find'),
    edit: [
      ...OPERATORS.slice(0, 3).map((op) => ({ keys: op.keys, what: op.what, rank: op.rank })),
      ...NORMAL_EXTRAS.edit,
      ...OPERATORS.slice(3).map((op) => ({ keys: op.keys, what: op.what, rank: op.rank + 10 })),
    ],
    insert: NORMAL_EXTRAS.insert,
    select: NORMAL_EXTRAS.select,
    repeat: NORMAL_EXTRAS.repeat,
    screen: NORMAL_EXTRAS.screen,
  };
  return NORMAL_GROUPS.map((g) => ({
    id: g.id,
    title: g.title,
    hue: g.hue,
    visible: g.visible,
    entries: [...byId[g.id]].sort(sortRank),
  }));
}

function visualView(mode: EditorMode): ResolvedGroup[] {
  const actions =
    mode === 'visual-block'
      ? [...VISUAL_BLOCK_EXTRAS, ...[...VISUAL_ACTIONS].sort(sortRank)]
      : [...VISUAL_ACTIONS].sort(sortRank);
  const grow: HelpEntry[] = [
    ...MOTIONS.filter((m) => !m.motionOnly).map((m) => ({
      keys: m.keys,
      what: `stretch the selection ${m.what}`,
      rank: m.rank + (m.group === 'find' ? 30 : 0),
      unit: m.unit,
    })),
    { keys: ['i'], what: 'stretch it to a whole text object — press w, {, " next', rank: 0 },
    { keys: ['a'], what: 'stretch it around a whole text object, delimiters included', rank: 0.5 },
  ];
  const byId: Record<VisualGroupId, HelpEntry[]> = {
    act: actions,
    grow: [...grow].sort(sortRank),
    shape: [...VISUAL_SHAPE].sort(sortRank),
  };
  return VISUAL_GROUPS.map((g) => ({
    id: g.id,
    title: g.title,
    hue: g.hue,
    visible: g.visible,
    entries: byId[g.id],
  }));
}

function operatorGroups(
  opKeys: string[],
  verb: string,
  doubled: string,
  doubledWhat: string,
): ResolvedGroup[] {
  const motion: HelpEntry[] = MOTIONS.filter((m) => !m.motionOnly).map((m) => ({
    keys: [...opKeys, ...m.keys],
    what: `${verb} ${m.after}`,
    rank: m.rank + (m.group === 'find' ? 20 : 0),
    unit: m.unit,
  }));

  const object: HelpEntry[] = TEXT_OBJECTS.flatMap((o) => [
    { keys: [...opKeys, 'i', o.key], what: `${verb} ${o.inner}`, rank: o.rank * 2 - 1 },
    { keys: [...opKeys, 'a', o.key], what: `${verb} ${o.around}`, rank: o.rank * 2 },
  ]);

  return [
    {
      id: 'line',
      title: 'The whole line',
      hue: 'coral',
      visible: 1,
      entries: [{ keys: [...opKeys, doubled], what: doubledWhat, rank: 1, unit: 'lines' }],
    },
    { id: 'motion', title: 'As far as a motion', hue: 'blue', visible: 8, entries: motion },
    { id: 'object', title: 'A whole text object', hue: 'butter', visible: 6, entries: object },
    {
      id: 'count',
      title: 'With a count',
      hue: 'violet',
      visible: 2,
      entries: [
        { keys: [...opKeys, '3', 'j'], what: `${verb} this line and the three below it`, rank: 1 },
        { keys: [...opKeys, '2', 'w'], what: `${verb} the next two words`, rank: 2 },
      ],
    },
  ];
}

function textObjectGroups(opKeys: string[], verb: string, kind: 'i' | 'a'): ResolvedGroup[] {
  const entries: HelpEntry[] = TEXT_OBJECTS.map((o) => ({
    keys: [...opKeys, kind, o.key],
    what: `${verb} ${kind === 'i' ? o.inner : o.around}`,
    rank: o.rank,
  }));
  return [
    {
      id: 'object',
      title: kind === 'i' ? 'Inside one of these' : 'Around one of these, delimiters included',
      hue: 'butter',
      visible: 7,
      entries,
    },
  ];
}

const G_ENTRIES: HelpEntry[] = [
  { keys: ['g', 'g'], what: 'jump to the first line of the file', rank: 1 },
  { keys: ['g', 'U'], what: 'uppercase — then say how much, as in gUiw', rank: 2 },
  { keys: ['g', 'u'], what: 'lowercase — then say how much, as in guiw', rank: 3 },
  { keys: ['g', 'v'], what: 'select whatever you had selected last time', rank: 4 },
  { keys: ['g', 'J'], what: 'join the next line on without adding a space', rank: 5 },
  { keys: ['g', '_'], what: 'to the last character on the line that is not a space', rank: 6 },
];

const Z_ENTRIES: HelpEntry[] = [
  { keys: ['z', 'z'], what: 'redraw with this line in the middle of the screen', rank: 1 },
  { keys: ['z', 't'], what: 'redraw with this line at the top', rank: 2 },
  { keys: ['z', 'b'], what: 'redraw with this line at the bottom', rank: 3 },
];

const REGISTER_ENTRIES: HelpEntry[] = [
  { keys: ['"', 'a'], what: 'use register a — or any other letter, twenty-six of them', rank: 1 },
  { keys: ['"', '0'], what: 'the last thing you yanked, which deletes never overwrite', rank: 2 },
  { keys: ['"', '_'], what: 'the black hole — delete without losing your last yank', rank: 3 },
  { keys: ['"', '+'], what: 'the system clipboard, where the browser allows it', rank: 4 },
];

const MODE_TITLE: Record<EditorMode, string> = {
  normal: 'Normal mode',
  insert: 'Insert mode',
  visual: 'Visual mode',
  'visual-line': 'Visual line mode',
  'visual-block': 'Visual block mode',
  replace: 'Replace mode',
};

const isVisual = (m: EditorMode): boolean =>
  m === 'visual' || m === 'visual-line' || m === 'visual-block';

/** The swallow check must run before the operator check: after `df` vim wants a literal. */
export function resolveHelp(mode: EditorMode, pendingKeys: string): HelpView {
  const p = parsePending(pendingKeys);
  const base = {
    typed: p.atoms,
    typedLen: p.atoms.length,
    count: p.count,
    register: p.register,
    unknown: false,
  };

  if (p.registerPending) {
    return {
      ...base,
      typed: ['"'],
      typedLen: 1,
      title: 'Which register?',
      note: 'Registers are vim’s clipboards. Pick one, then yank or put.',
      groups: [
        {
          id: 'reg',
          title: 'Pick a register',
          hue: 'violet',
          visible: 4,
          entries: REGISTER_ENTRIES,
        },
      ],
    };
  }

  if (mode === 'insert' || mode === 'replace') {
    const entries = mode === 'insert' ? INSERT_ENTRIES : REPLACE_ENTRIES;
    return {
      ...base,
      typed: [],
      typedLen: 0,
      title: MODE_TITLE[mode],
      note:
        mode === 'insert'
          ? 'You are typing text, so vim’s motions are asleep.'
          : 'Everything you type overwrites what is already there.',
      groups: [
        { id: 'insert', title: 'The three worth knowing', hue: 'mint', visible: 3, entries },
      ],
    };
  }

  if (p.charArgFor !== null) {
    const opAtoms = p.atoms.slice(0, -1);
    const op = opAtoms.length > 0 ? operatorFor(opAtoms) : undefined;
    const motion = MOTIONS.find((m) => m.keys.length === 1 && m.keys[0] === p.charArgFor);
    const note =
      op !== undefined && motion !== undefined
        ? `${capitalise(op.verb)} ${motion.after}. Type that character now.`
        : (CHAR_ARG_PROMPTS[p.charArgFor] ?? 'Vim is waiting for one more character.');
    return {
      ...base,
      title: 'Waiting for a character',
      note,
      groups: [],
    };
  }

  if (isVisual(mode)) {
    if (p.atoms.length === 0) {
      return {
        ...base,
        title: MODE_TITLE[mode],
        note:
          mode === 'visual-block'
            ? 'A rectangle is selected. I and A type down its whole edge at once.'
            : 'Something is selected. Now do one thing to all of it.',
        groups: visualView(mode),
      };
    }
    if (p.atoms.length === 1 && (p.atoms[0] === 'i' || p.atoms[0] === 'a')) {
      const kind = p.atoms[0];
      return {
        ...base,
        title: kind === 'i' ? 'Select inside what?' : 'Select around what?',
        note: 'Pick the thing; the selection snaps to all of it.',
        groups: textObjectGroups([], 'select', kind),
      };
    }
  }

  if (mode === 'normal') {
    if (p.atoms.length === 0) {
      return {
        ...base,
        title: 'Normal mode',
        note: p.count !== null ? null : 'Press a key and this panel narrows to what can follow it.',
        groups: normalView(),
      };
    }

    const op = operatorFor(p.atoms);
    if (op !== undefined) {
      return {
        ...base,
        title: `${capitalise(op.verb)} how much?`,
        note: `Vim is holding ${op.keys.join('')} and waiting for how far it reaches.`,
        groups: operatorGroups(op.keys, op.verb, op.doubled, op.doubledWhat),
      };
    }

    const last = p.atoms[p.atoms.length - 1];
    if (last === 'i' || last === 'a') {
      const outer = operatorFor(p.atoms.slice(0, -1));
      if (outer !== undefined) {
        return {
          ...base,
          title:
            last === 'i'
              ? `${capitalise(outer.verb)} inside what?`
              : `${capitalise(outer.verb)} around what?`,
          note:
            last === 'i' ? 'The delimiters stay.' : 'The delimiters go too, and the space after.',
          groups: textObjectGroups(outer.keys, outer.verb, last),
        };
      }
    }

    if (last === 'g' && p.atoms.length > 1) {
      const outer = operatorFor(p.atoms.slice(0, -1));
      if (outer !== undefined) {
        return {
          ...base,
          title: `${capitalise(outer.verb)} how much?`,
          note: 'One more g reaches the top of the file.',
          groups: [
            {
              id: 'motion',
              title: 'As far as a motion',
              hue: 'blue',
              visible: 2,
              entries: [
                {
                  keys: [...outer.keys, 'g', 'g'],
                  what: `${outer.verb} from here up to the first line, whole lines`,
                  rank: 1,
                },
              ],
            },
          ],
        };
      }
    }

    if (p.atoms.length === 1 && p.atoms[0] === 'g') {
      return {
        ...base,
        title: 'The g commands',
        note: 'g is a second alphabet. These are the ones people use.',
        groups: [{ id: 'g', title: 'After g', hue: 'violet', visible: 6, entries: G_ENTRIES }],
      };
    }

    if (p.atoms.length === 1 && p.atoms[0] === 'z') {
      return {
        ...base,
        title: 'Move the view',
        note: 'The cursor stays on its line; the window scrolls around it.',
        groups: [{ id: 'z', title: 'After z', hue: 'violet', visible: 3, entries: Z_ENTRIES }],
      };
    }
  }

  return {
    ...base,
    unknown: true,
    title: 'Vim is mid-command',
    note: `It is holding ${p.raw} and this panel does not know what comes next. Esc cancels it.`,
    groups: [],
  };
}
