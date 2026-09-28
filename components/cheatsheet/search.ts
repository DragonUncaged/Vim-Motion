import { splitKeyGroup } from '@/lib/prose/richtext-parse';
import { cheatGroups, type CheatEntry } from '@/content/cheatsheet';

export interface IndexedCheat {
  entry: CheatEntry;
  groupId: string;
  plainKeys: string;
  words: string;
}

function plainKeysOf(keys: string): string {
  return splitKeyGroup(keys).join('');
}

function buildIndex(): IndexedCheat[] {
  const index: IndexedCheat[] = [];
  for (const group of cheatGroups) {
    for (const entry of group.entries) {
      index.push({
        entry,
        groupId: group.id,
        plainKeys: plainKeysOf(entry.keys),
        words: [entry.desc, ...(entry.tags ?? []), entry.note ?? ''].join(' ').toLowerCase(),
      });
    }
  }
  return index;
}

const flatIndex = buildIndex();

export const indexById: Map<string, IndexedCheat> = new Map(
  flatIndex.map((item) => [item.entry.id, item]),
);

/** The bands must stay ordered: exact key, then key prefix, then word hit. */
function score(item: IndexedCheat, query: string): number {
  const keys = item.plainKeys.toLowerCase();
  if (keys === query) return 100;
  if (keys.startsWith(query)) return 80;
  if (keys.includes(query)) return 60;

  const stem = query.length > 3 && query.endsWith('s') ? query.slice(0, -1) : query;
  const words = item.words;
  if (new RegExp(`\\b${escapeForRegExp(stem)}`).test(words)) return 40;
  if (words.includes(stem)) return 20;
  return 0;
}

function escapeForRegExp(source: string): string {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface CheatMatch {
  item: IndexedCheat;
  score: number;
}

export function searchCheats(rawQuery: string): CheatMatch[] {
  const query = rawQuery.trim().toLowerCase();
  if (query === '') return [];

  const matches: CheatMatch[] = [];
  for (const item of flatIndex) {
    const s = score(item, query);
    if (s > 0) matches.push({ item, score: s });
  }

  return matches.sort((a, b) => b.score - a.score);
}
