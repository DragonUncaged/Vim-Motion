import type { AttemptRecord, GhostKey } from '@/lib/progress';

export interface PersonalBest {
  timeMs: number;
  keystrokes: number;
  at: number;
  runs: number;
  timeline: GhostKey[] | null;
}

export function personalBest(attempts: AttemptRecord[], key: string): PersonalBest | null {
  let best: AttemptRecord | null = null;
  let runs = 0;
  for (const a of attempts) {
    if (!a.solved) continue;
    if (`${a.lessonSlug}/${a.exerciseId}` !== key) continue;
    runs += 1;
    if (a.timeMs <= 0) continue;
    if (best === null || a.timeMs < best.timeMs) best = a;
  }
  if (best === null) return null;
  return {
    timeMs: best.timeMs,
    keystrokes: best.keystrokes,
    at: best.at,
    runs,
    timeline: best.timeline ?? null,
  };
}

export function bestsByExercise(attempts: AttemptRecord[]): Map<string, PersonalBest> {
  const bests = new Map<string, PersonalBest>();
  for (const a of attempts) {
    if (!a.solved || a.timeMs <= 0) continue;
    const key = `${a.lessonSlug}/${a.exerciseId}`;
    const current = bests.get(key);
    if (current === undefined) {
      bests.set(key, {
        timeMs: a.timeMs,
        keystrokes: a.keystrokes,
        at: a.at,
        runs: 1,
        timeline: a.timeline ?? null,
      });
      continue;
    }
    current.runs += 1;
    if (a.timeMs < current.timeMs) {
      current.timeMs = a.timeMs;
      current.keystrokes = a.keystrokes;
      current.at = a.at;
      current.timeline = a.timeline ?? null;
    }
  }
  return bests;
}

export function keysPlayed(timeline: readonly GhostKey[], atMs: number): number {
  let played = 0;
  for (const entry of timeline) {
    if (entry.ms > atMs) break;
    played += 1;
  }
  return played;
}
