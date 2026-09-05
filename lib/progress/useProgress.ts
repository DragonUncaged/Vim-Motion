'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { AttemptRecord, ProgressBlob } from './schema';
import { emptyProgress } from './schema';
import {
  loadProgress,
  recordAttempt,
  clearProgress,
  storageAvailable,
  subscribeProgress,
} from './storage';

const EMPTY: ProgressBlob = emptyProgress();

interface Snapshot {
  blob: ProgressBlob;
  storageOk: boolean;
}

const SERVER: Snapshot = { blob: EMPTY, storageOk: true };

/** Cached so the snapshot is referentially stable between key events; getSnapshot must not allocate. */
let cache: Snapshot = SERVER;
let cacheValid = false;

/** Invalidated at module level, not in subscribe: app/error.tsx clears storage after the crashed page has unmounted. */
subscribeProgress(() => {
  cacheValid = false;
});

function getSnapshot(): Snapshot {
  if (!cacheValid) {
    cache = { blob: loadProgress(), storageOk: storageAvailable() };
    cacheValid = true;
  }
  return cache;
}

function getServerSnapshot(): Snapshot {
  return SERVER;
}

function subscribe(onChange: () => void): () => void {
  return subscribeProgress(onChange);
}

export interface UseProgress {
  attempts: AttemptRecord[];
  hydrated: boolean;
  storageOk: boolean;
  solvedLessons: Set<string>;
  solvedExercises: Set<string>;
  record: (attempt: AttemptRecord) => boolean;
  clear: () => boolean;
}

export function useProgress(): UseProgress {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { blob } = snapshot;
  const hydrated = snapshot !== SERVER || cacheValid;
  const storageOk = hydrated ? snapshot.storageOk : true;

  const { solvedLessons, solvedExercises } = useMemo(() => {
    const lessons = new Set<string>();
    const exercises = new Set<string>();
    for (const a of blob.attempts) {
      if (!a.solved) continue;
      lessons.add(a.lessonSlug);
      exercises.add(`${a.lessonSlug}/${a.exerciseId}`);
    }
    return { solvedLessons: lessons, solvedExercises: exercises };
  }, [blob]);

  const record = useCallback((attempt: AttemptRecord) => recordAttempt(attempt), []);
  const clear = useCallback(() => clearProgress(), []);

  return {
    attempts: blob.attempts,
    hydrated,
    storageOk,
    solvedLessons,
    solvedExercises,
    record,
    clear,
  };
}

export function lessonCompletion(
  solvedExercises: Set<string>,
  lessonSlug: string,
  exerciseIds: string[],
): number {
  if (exerciseIds.length === 0) return 0;
  const done = exerciseIds.filter((id) => solvedExercises.has(`${lessonSlug}/${id}`)).length;
  return done / exerciseIds.length;
}
