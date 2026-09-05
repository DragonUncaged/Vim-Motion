/** docs/CONTRACT.md §6 */

/** Bump only for a breaking change: an unknown version discards the stored history. */
export const PROGRESS_VERSION = 1 as const;

/** docs/CONTRACT.md §6 */
export const STORAGE_PREFIX = 'vimclay:v1:';
export const ATTEMPTS_KEY = `${STORAGE_PREFIX}attempts`;

export interface GhostKey {
  key: string;
  ms: number;
}

export const MAX_TIMELINE_KEYS = 256;

export const MAX_KEY_LENGTH = 16;

export interface AttemptRecord {
  exerciseId: string;
  lessonSlug: string;
  /** Copied at attempt time so renaming a motion later cannot rewrite history. */
  motions: string[];
  timeMs: number;
  keystrokes: number;
  wastedKeys: number;
  par: number;
  solved: boolean;
  at: number;
  timeline?: GhostKey[];
}

export interface ProgressBlob {
  version: typeof PROGRESS_VERSION;
  attempts: AttemptRecord[];
}

export const emptyProgress = (): ProgressBlob => ({ version: PROGRESS_VERSION, attempts: [] });

export const MAX_ATTEMPTS = 5000;

/** Names are not checked against the registry: history has to survive a renamed lesson. */
export const MAX_FIELD_LENGTH = 128;
export const MAX_MOTIONS = 32;
export const MAX_COUNTER = 1e9;
/** ECMAScript §21.4.1.1: past this `new Date` is Invalid Date and Intl.DateTimeFormat.format throws. */
export const MAX_TIME_VALUE = 8.64e15;
export const MAX_ATTEMPT_MS = 86_400_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isShortString(value: unknown): value is string {
  return typeof value === 'string' && value !== '' && value.length <= MAX_FIELD_LENGTH;
}

function isMotionList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_MOTIONS &&
    value.every((v) => typeof v === 'string' && v.length <= MAX_FIELD_LENGTH)
  );
}

function isCounter(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_COUNTER;
}

function isDuration(value: unknown): value is number {
  return isCounter(value) && value <= MAX_ATTEMPT_MS;
}

function isTimeValue(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= MAX_TIME_VALUE
  );
}

export function parseTimeline(value: unknown): GhostKey[] | undefined {
  if (!Array.isArray(value)) return undefined;
  if (value.length === 0 || value.length > MAX_TIMELINE_KEYS) return undefined;

  const timeline: GhostKey[] = [];
  let previous = -1;
  for (const entry of value) {
    if (!isRecord(entry)) return undefined;
    const { key, ms } = entry;
    if (typeof key !== 'string' || key === '' || key.length > MAX_KEY_LENGTH) return undefined;
    if (!isDuration(ms)) return undefined;
    if (ms < previous) return undefined;
    previous = ms;
    timeline.push({ key, ms });
  }
  return timeline;
}

export function parseAttempt(value: unknown): AttemptRecord | null {
  if (!isRecord(value)) return null;
  const {
    exerciseId,
    lessonSlug,
    motions,
    timeMs,
    keystrokes,
    wastedKeys,
    par,
    solved,
    at,
    timeline,
  } = value;

  if (!isShortString(exerciseId)) return null;
  if (!isShortString(lessonSlug)) return null;
  if (!isMotionList(motions)) return null;
  if (!isDuration(timeMs)) return null;
  if (!isCounter(keystrokes)) return null;
  if (!isCounter(wastedKeys)) return null;
  if (!isCounter(par)) return null;
  if (typeof solved !== 'boolean') return null;
  if (!isTimeValue(at)) return null;

  const record: AttemptRecord = {
    exerciseId,
    lessonSlug,
    motions,
    timeMs,
    keystrokes,
    wastedKeys,
    par,
    solved,
    at,
  };
  const parsed = parseTimeline(timeline);
  if (parsed !== undefined) record.timeline = parsed;
  return record;
}

export function parseProgressBlob(value: unknown): ProgressBlob | null {
  if (!isRecord(value)) return null;
  if (value.version !== PROGRESS_VERSION) return null;
  if (!Array.isArray(value.attempts)) return null;
  const attempts = value.attempts.map(parseAttempt).filter((a): a is AttemptRecord => a !== null);
  return { version: PROGRESS_VERSION, attempts };
}
