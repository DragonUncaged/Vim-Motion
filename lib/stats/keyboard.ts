import { normalizeKeyName } from '@/lib/keyboard';

export interface KeyCap {
  label: string;
  shifted?: string;
  span?: number;
}

export const KEYBOARD_ROWS: KeyCap[][] = [
  [
    { label: 'Esc', span: 1.6 },
    { label: '`', shifted: '~' },
    { label: '1', shifted: '!' },
    { label: '2', shifted: '@' },
    { label: '3', shifted: '#' },
    { label: '4', shifted: '$' },
    { label: '5', shifted: '%' },
    { label: '6', shifted: '^' },
    { label: '7', shifted: '&' },
    { label: '8', shifted: '*' },
    { label: '9', shifted: '(' },
    { label: '0', shifted: ')' },
    { label: '-', shifted: '_' },
    { label: '=', shifted: '+' },
    { label: 'BS', span: 1.6 },
  ],
  [
    { label: 'Tab', span: 1.6 },
    { label: 'q', shifted: 'Q' },
    { label: 'w', shifted: 'W' },
    { label: 'e', shifted: 'E' },
    { label: 'r', shifted: 'R' },
    { label: 't', shifted: 'T' },
    { label: 'y', shifted: 'Y' },
    { label: 'u', shifted: 'U' },
    { label: 'i', shifted: 'I' },
    { label: 'o', shifted: 'O' },
    { label: 'p', shifted: 'P' },
    { label: '[', shifted: '{' },
    { label: ']', shifted: '}' },
    { label: '\\', shifted: '|' },
  ],
  [
    { label: 'a', shifted: 'A' },
    { label: 's', shifted: 'S' },
    { label: 'd', shifted: 'D' },
    { label: 'f', shifted: 'F' },
    { label: 'g', shifted: 'G' },
    { label: 'h', shifted: 'H' },
    { label: 'j', shifted: 'J' },
    { label: 'k', shifted: 'K' },
    { label: 'l', shifted: 'L' },
    { label: ';', shifted: ':' },
    { label: "'", shifted: '"' },
    { label: 'CR', span: 1.8 },
  ],
  [
    { label: 'z', shifted: 'Z' },
    { label: 'x', shifted: 'X' },
    { label: 'c', shifted: 'C' },
    { label: 'v', shifted: 'V' },
    { label: 'b', shifted: 'B' },
    { label: 'n', shifted: 'N' },
    { label: 'm', shifted: 'M' },
    { label: ',', shifted: '<' },
    { label: '.', shifted: '>' },
    { label: '/', shifted: '?' },
  ],
  [{ label: 'Space', span: 7 }],
];

const CAP_BY_GLYPH: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const row of KEYBOARD_ROWS) {
    for (const cap of row) {
      map.set(cap.label, cap.label);
      if (cap.shifted !== undefined) map.set(cap.shifted, cap.label);
    }
  }
  return map;
})();

export const ALL_CAPS: string[] = KEYBOARD_ROWS.flat().map((cap) => cap.label);

/** docs/CONTRACT.md §4 notation; `<C-d>` counts as the `d` key. */
export function motionKeys(motion: string): string[] {
  const keys: string[] = [];
  let i = 0;
  while (i < motion.length) {
    const char = motion.charAt(i);
    if (char === '<') {
      const close = motion.indexOf('>', i + 1);
      if (close !== -1) {
        keys.push(normalizeKeyName(motion.slice(i, close + 1)));
        i = close + 1;
        continue;
      }
    }
    keys.push(normalizeKeyName(char));
    i += 1;
  }
  return keys;
}

export function capForKey(key: string): string | null {
  const base = /^[CM]-(.+)$/.exec(key)?.[1] ?? key;
  return CAP_BY_GLYPH.get(base) ?? null;
}

export function motionCaps(motion: string): string[] {
  const caps: string[] = [];
  for (const key of motionKeys(motion)) {
    const cap = capForKey(key);
    if (cap !== null && !caps.includes(cap)) caps.push(cap);
  }
  return caps;
}

export interface CapHeat {
  cap: string;
  mastery: number | null;
  motions: { motion: string; mastery: number | null }[];
}

export function capHeat(mastery: Record<string, number | null>): Record<string, CapHeat> {
  const heat: Record<string, CapHeat> = {};
  for (const cap of ALL_CAPS) heat[cap] = { cap, mastery: null, motions: [] };

  for (const [motion, score] of Object.entries(mastery)) {
    for (const cap of motionCaps(motion)) {
      heat[cap]?.motions.push({ motion, mastery: score });
    }
  }

  for (const entry of Object.values(heat)) {
    entry.motions.sort((a, b) => {
      if (a.mastery === null && b.mastery === null) return a.motion.localeCompare(b.motion);
      if (a.mastery === null) return 1;
      if (b.mastery === null) return -1;
      return b.mastery - a.mastery || a.motion.localeCompare(b.motion);
    });
    const scored = entry.motions.filter(
      (m): m is { motion: string; mastery: number } => m.mastery !== null,
    );
    entry.mastery =
      scored.length === 0 ? null : scored.reduce((sum, m) => sum + m.mastery, 0) / scored.length;
  }

  return heat;
}
