import type { Module } from '@/content/types';
import { modules } from '@/content/modules';
import {
  isFindMotion,
  isInsertEdit,
  isJump,
  isOperator,
  isRepeat,
  isSearch,
  isTextObject,
  isVisual,
  isWordMotion,
} from './motions';
import type { DrillCategory, DrillItem } from './types';

const byMotion =
  (test: (motion: string) => boolean) =>
  (item: DrillItem): boolean =>
    item.motions.some(test);

const EVERY_MOTION = (): boolean => true;

const MODULE_BLURB: Record<string, string> = {
  basics: 'Ten from the moves your hands should do without thinking.',
  operators: 'Verb plus noun, drawn from across the grammar lessons.',
  'react-tsx': 'Ten edits on real .tsx — props, hooks and JSX.',
  go: 'Structs, error blocks and signatures, in real Go.',
  cpp: 'Templates, scopes and includes, where nesting gets deep.',
};

const moduleCategories: DrillCategory[] = [...modules]
  .sort((a: Module, b: Module) => a.order - b.order)
  .map((m) => ({
    id: m.id,
    name: m.name,
    kind: 'module' as const,
    blurb: MODULE_BLURB[m.id] ?? m.blurb,
    hue: m.accent,
    moduleId: m.id,
    matches: (item: DrillItem) => item.moduleId === m.id,
    coversMotion: EVERY_MOTION,
  }));

const groupCategories: DrillCategory[] = [
  {
    id: 'word-motions',
    name: 'Word motions',
    kind: 'group',
    blurb: 'Moving a word at a time, and deleting or changing by the word.',
    hue: 'blue',
    matches: byMotion(isWordMotion),
    coversMotion: isWordMotion,
  },
  {
    id: 'find-till',
    name: 'Find and till',
    kind: 'group',
    blurb: 'Jumping to a character on the line, and stopping just before it.',
    hue: 'butter',
    matches: byMotion(isFindMotion),
    coversMotion: isFindMotion,
  },
  {
    id: 'text-objects',
    name: 'Text objects',
    kind: 'group',
    blurb: 'Inside and around: words, quotes, brackets, paragraphs and tags.',
    hue: 'mint',
    matches: byMotion(isTextObject),
    coversMotion: isTextObject,
  },
  {
    id: 'operator-grammar',
    name: 'Operators',
    kind: 'group',
    blurb: 'Delete, change, yank and put, aimed at every kind of target.',
    hue: 'violet',
    matches: byMotion(isOperator),
    coversMotion: isOperator,
  },
  {
    id: 'search',
    name: 'Search',
    kind: 'group',
    blurb: 'Finding a word anywhere in the file and walking the matches.',
    hue: 'coral',
    matches: byMotion(isSearch),
    coversMotion: isSearch,
  },
  {
    id: 'jumps',
    name: 'Jumps and scrolling',
    kind: 'group',
    blurb: 'Crossing a file: lines, paragraphs, brackets, marks and half-pages.',
    hue: 'blue',
    matches: byMotion(isJump),
    coversMotion: isJump,
  },
  {
    id: 'insert-edits',
    name: 'Insert and small edits',
    kind: 'group',
    blurb: 'Getting into insert at the right spot, and the one-key fixes.',
    hue: 'mint',
    matches: byMotion(isInsertEdit),
    coversMotion: isInsertEdit,
  },
  {
    id: 'visual',
    name: 'Visual mode',
    kind: 'group',
    blurb: 'Selecting first and acting second, including the block cursor.',
    hue: 'butter',
    matches: byMotion(isVisual),
    coversMotion: isVisual,
  },
  {
    id: 'undo-repeat',
    name: 'Undo and repeat',
    kind: 'group',
    blurb: 'Taking an edit back, doing it again, and recording a macro.',
    hue: 'violet',
    matches: byMotion(isRepeat),
    coversMotion: isRepeat,
  },
];

export const WEAKEST: DrillCategory = {
  id: 'weakest',
  name: 'My weakest',
  kind: 'weakest',
  blurb: 'Ten from anywhere in the curriculum, chosen because you are worst at them.',
  hue: 'coral',
  matches: EVERY_MOTION,
  coversMotion: EVERY_MOTION,
};

export const categories: DrillCategory[] = [WEAKEST, ...groupCategories, ...moduleCategories];

const byId = new Map<string, DrillCategory>();
for (const category of categories) {
  if (byId.has(category.id)) {
    throw new Error(`Duplicate drill category id "${category.id}".`);
  }
  byId.set(category.id, category);
}

export function categoryById(id: string): DrillCategory | undefined {
  return byId.get(id);
}

export function itemsFor(pool: DrillItem[], category: DrillCategory): DrillItem[] {
  return pool.filter(category.matches);
}

export function motionsFor(pool: DrillItem[], category: DrillCategory): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const item of itemsFor(pool, category)) {
    for (const motion of item.motions) {
      if (motion === '' || seen.has(motion) || !category.coversMotion(motion)) continue;
      seen.add(motion);
      ordered.push(motion);
    }
  }
  return ordered;
}
