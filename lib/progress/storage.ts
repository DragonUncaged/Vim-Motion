import { safeStorage, storageWritable } from '@/lib/storage';
import {
  ATTEMPTS_KEY,
  MAX_ATTEMPTS,
  PROGRESS_VERSION,
  emptyProgress,
  parseProgressBlob,
  type AttemptRecord,
  type ProgressBlob,
} from './schema';

/** No probe write: at exactly quota the probe was the write that failed, before the halving fallback ran. */
const storage = safeStorage;

export function storageAvailable(): boolean {
  const s = storage();
  return s !== null && storageWritable(s);
}

export function loadProgress(): ProgressBlob {
  const s = storage();
  if (s === null) return emptyProgress();
  let raw: string | null;
  try {
    raw = s.getItem(ATTEMPTS_KEY);
  } catch {
    return emptyProgress();
  }
  if (raw === null) return emptyProgress();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return emptyProgress();
  }
  return parseProgressBlob(parsed) ?? emptyProgress();
}

export function saveProgress(blob: ProgressBlob): boolean {
  const s = storage();
  if (s === null) return false;
  const trimmed: ProgressBlob = {
    version: PROGRESS_VERSION,
    attempts:
      blob.attempts.length > MAX_ATTEMPTS ? blob.attempts.slice(-MAX_ATTEMPTS) : blob.attempts,
  };
  try {
    s.setItem(ATTEMPTS_KEY, JSON.stringify(trimmed));
    notify();
    return true;
  } catch {
    try {
      const halved: ProgressBlob = {
        version: PROGRESS_VERSION,
        attempts: trimmed.attempts.slice(Math.floor(trimmed.attempts.length / 2)),
      };
      s.setItem(ATTEMPTS_KEY, JSON.stringify(halved));
      notify();
      return true;
    } catch {
      return false;
    }
  }
}

const exerciseKey = (a: AttemptRecord): string => `${a.lessonSlug}/${a.exerciseId}`;

/**
 * Only a solved run that beats every earlier solve keeps its timeline, matching the min in lib/drills/bests.ts.
 * Earlier timelines for that exercise are pruned, so this is the one record field that is not write-once.
 */
export function applyTimelinePolicy(
  attempts: readonly AttemptRecord[],
  next: AttemptRecord,
): AttemptRecord[] {
  const stripped = ({ timeline: _dropped, ...rest }: AttemptRecord): AttemptRecord => rest;

  if (next.timeline === undefined) return [...attempts, next];

  const key = exerciseKey(next);
  const beatsEverything =
    next.solved &&
    next.timeMs > 0 &&
    !attempts.some(
      (a) => a.solved && a.timeMs > 0 && a.timeMs <= next.timeMs && exerciseKey(a) === key,
    );
  if (!beatsEverything) return [...attempts, stripped(next)];

  const kept = attempts.map((a) =>
    a.timeline !== undefined && exerciseKey(a) === key ? stripped(a) : a,
  );
  return [...kept, next];
}

export function recordAttempt(attempt: AttemptRecord): boolean {
  const blob = loadProgress();
  return saveProgress({
    version: blob.version,
    attempts: applyTimelinePolicy(blob.attempts, attempt),
  });
}

export function clearProgress(): boolean {
  const s = storage();
  if (s === null) return false;
  try {
    s.removeItem(ATTEMPTS_KEY);
    notify();
    return true;
  } catch {
    return false;
  }
}

/** localStorage fires no storage event in the tab that wrote it. */
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function subscribeProgress(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === ATTEMPTS_KEY) listener();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}
