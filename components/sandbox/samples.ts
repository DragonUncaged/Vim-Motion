import { STORAGE_PREFIX } from '@/lib/progress';
import type { LessonLanguage } from '@/content/types';
import { safeStorage, storageWritable } from '@/lib/storage';
import { habitCard } from '@/content/lessons/react-tsx/habit-card';
import { storeGo } from '@/content/lessons/go/source';
import { ringBufferCpp } from '@/content/lessons/cpp/source';

export interface Sample {
  id: string;
  label: string;
  language: LessonLanguage;
  filename: string;
  doc: string;
}

const notes = [
  'Motions worth drilling until they are boring',
  '',
  'The first thing to unlearn is the arrow keys. Everything',
  'below assumes your hands never leave the home row, which',
  'is the whole argument for vim (and the only one that',
  'survives contact with a real deadline).',
  '',
  'Three habits, in the order they pay off:',
  '',
  '  1. reach for "w" and "b" instead of holding a direction',
  '  2. say it once: "ci(" beats twelve presses of "x"',
  '  3. let "." repeat the edit rather than retyping it',
  '',
  'A quoted line sits here so you can try ci" on it, and a',
  '(parenthesised aside) is here for ci( - the cursor only',
  'has to be somewhere inside.',
  '',
  'Delete this paragraph with dap and put it back with u.',
  'Nothing here is saved anywhere, nothing is scored, and no',
  'exercise is waiting for you to get it right.',
].join('\n');

export const SAMPLES: Sample[] = [
  { id: 'notes', label: 'Plain text', language: 'text', filename: 'notes.txt', doc: notes },
  {
    id: 'tsx',
    label: 'React + TypeScript',
    language: 'tsx',
    filename: 'HabitCard.tsx',
    doc: habitCard,
  },
  { id: 'go', label: 'Go', language: 'go', filename: 'store.go', doc: storeGo },
  { id: 'cpp', label: 'C++', language: 'cpp', filename: 'ring_buffer.h', doc: ringBufferCpp },
];

export const CUSTOM_ID = 'custom';

export function sampleById(id: string): Sample | undefined {
  return SAMPLES.find((s) => s.id === id);
}

export const LANGUAGES: { id: LessonLanguage; label: string }[] = [
  { id: 'text', label: 'Plain text' },
  { id: 'tsx', label: 'TypeScript' },
  { id: 'go', label: 'Go' },
  { id: 'cpp', label: 'C++' },
];

const EXTENSIONS: Record<string, LessonLanguage> = {
  ts: 'tsx',
  tsx: 'tsx',
  js: 'tsx',
  jsx: 'tsx',
  mjs: 'tsx',
  cjs: 'tsx',
  json: 'tsx',
  go: 'go',
  c: 'cpp',
  h: 'cpp',
  cc: 'cpp',
  cpp: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  hh: 'cpp',
  hxx: 'cpp',
};

export function languageFromFilename(name: string): LessonLanguage {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return 'text';
  return EXTENSIONS[name.slice(dot + 1).toLowerCase()] ?? 'text';
}

const KEY = `${STORAGE_PREFIX}sandbox`;
const VERSION = 1;

export const MAX_CUSTOM = 100_000;

export interface Truncation {
  text: string;
  truncated: boolean;
}

export function truncateCustom(text: string): Truncation {
  if (text.length <= MAX_CUSTOM) return { text, truncated: false };
  return { text: text.slice(0, MAX_CUSTOM), truncated: true };
}

export interface SandboxPrefs {
  sampleId: string;
  language: LessonLanguage;
  custom: string;
  customName: string;
}

const FIRST_SAMPLE: Pick<Sample, 'id' | 'language'> = SAMPLES[0] ?? {
  id: CUSTOM_ID,
  language: 'text',
};

export const DEFAULT_PREFS: SandboxPrefs = {
  sampleId: FIRST_SAMPLE.id,
  language: FIRST_SAMPLE.language,
  custom: '',
  customName: '',
};

function storage(): Storage | null {
  const s = safeStorage();
  return s !== null && storageWritable(s) ? s : null;
}

export function prefsWritable(): boolean {
  return storage() !== null;
}

function isLanguage(v: unknown): v is LessonLanguage {
  return v === 'text' || v === 'tsx' || v === 'go' || v === 'cpp';
}

export function loadPrefs(): SandboxPrefs {
  const s = storage();
  if (s === null) return DEFAULT_PREFS;
  let raw: string | null;
  try {
    raw = s.getItem(KEY);
  } catch {
    return DEFAULT_PREFS;
  }
  if (raw === null) return DEFAULT_PREFS;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_PREFS;
  }
  if (typeof parsed !== 'object' || parsed === null) return DEFAULT_PREFS;
  const blob = parsed as Record<string, unknown>;
  if (blob.version !== VERSION) return DEFAULT_PREFS;

  const sampleId = typeof blob.sampleId === 'string' ? blob.sampleId : DEFAULT_PREFS.sampleId;
  const custom = truncateCustom(typeof blob.custom === 'string' ? blob.custom : '').text;
  const customName = typeof blob.customName === 'string' ? blob.customName : '';
  const language = isLanguage(blob.language) ? blob.language : DEFAULT_PREFS.language;

  if (sampleId === CUSTOM_ID) {
    if (custom === '') return DEFAULT_PREFS;
    return { sampleId, language, custom, customName };
  }
  const sample = sampleById(sampleId);
  if (sample === undefined) return DEFAULT_PREFS;
  return { sampleId, language: sample.language, custom, customName };
}

export function savePrefs(prefs: SandboxPrefs): boolean {
  const s = storage();
  if (s === null) return false;
  const custom = truncateCustom(prefs.custom).text;
  try {
    s.setItem(
      KEY,
      JSON.stringify({
        version: VERSION,
        sampleId:
          custom === '' && prefs.sampleId === CUSTOM_ID ? DEFAULT_PREFS.sampleId : prefs.sampleId,
        language: prefs.language,
        custom,
        customName: prefs.customName,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
