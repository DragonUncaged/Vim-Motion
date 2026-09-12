import type { AttemptRecord } from '@/lib/progress';
import { accuracy, kpm } from './metrics';

export const SESSION_GAP_MS = 30 * 60_000;

export interface Session {
  startedAt: number;
  endedAt: number;
  attempts: number;
  solved: number;
  keystrokes: number;
  wastedKeys: number;
  timeMs: number;
  kpm: number;
  accuracy: number;
}

export function sessions(attempts: AttemptRecord[]): Session[] {
  const ordered = [...attempts].sort((a, b) => a.at - b.at);
  const first = ordered[0];
  if (first === undefined) return [];

  const groups: AttemptRecord[][] = [];
  let group: AttemptRecord[] = [first];
  let previousAt = first.at;
  for (const attempt of ordered.slice(1)) {
    if (attempt.at - previousAt > SESSION_GAP_MS) {
      groups.push(group);
      group = [];
    }
    group.push(attempt);
    previousAt = attempt.at;
  }
  groups.push(group);

  return groups.map((entries) => {
    const keystrokes = entries.reduce((sum, a) => sum + a.keystrokes, 0);
    const wastedKeys = entries.reduce((sum, a) => sum + a.wastedKeys, 0);
    const timeMs = entries.reduce((sum, a) => sum + a.timeMs, 0);
    return {
      startedAt: entries[0]?.at ?? 0,
      endedAt: entries.at(-1)?.at ?? 0,
      attempts: entries.length,
      solved: entries.filter((a) => a.solved).length,
      keystrokes,
      wastedKeys,
      timeMs,
      kpm: kpm(keystrokes, timeMs),
      accuracy: accuracy(wastedKeys, keystrokes),
    };
  });
}
