/** docs/CONTRACT.md §6, implemented exactly as written; AttemptState (docs/CONTRACT.md §11) must agree. */

import type { AttemptRecord } from '@/lib/progress';

/** docs/CONTRACT.md §6 */
export const PAR_MULTIPLE = 2;

export function efficiency(par: number, keystrokes: number): number {
  if (keystrokes <= 0) return 100;
  if (par <= 0) return 100;
  return Math.min(par / keystrokes, 1) * 100;
}

export function accuracy(wastedKeys: number, keystrokes: number): number {
  if (keystrokes <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - wastedKeys / keystrokes));
}

export function kpm(keystrokes: number, timeMs: number): number {
  if (timeMs <= 0) return 0;
  return keystrokes / (timeMs / 60_000);
}

export function attemptEfficiency(a: AttemptRecord): number {
  return efficiency(a.par, a.keystrokes);
}

export function attemptAccuracy(a: AttemptRecord): number {
  return accuracy(a.wastedKeys, a.keystrokes);
}

export function attemptKpm(a: AttemptRecord): number {
  return kpm(a.keystrokes, a.timeMs);
}

export function exceededPar(a: AttemptRecord): boolean {
  if (a.par <= 0) return false;
  return a.keystrokes > PAR_MULTIPLE * a.par;
}

export function isCleanSolve(a: AttemptRecord): boolean {
  return a.solved && !exceededPar(a);
}

export interface Streaks {
  current: number;
  best: number;
}

/** docs/CONTRACT.md §6. Walked in time order, because an import merges another device's attempts mid-list. */
export function streaks(attempts: AttemptRecord[]): Streaks {
  const ordered = [...attempts].sort((a, b) => a.at - b.at);
  let best = 0;
  let run = 0;
  for (const a of ordered) {
    if (isCleanSolve(a)) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return { current: run, best };
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const upper = sorted[mid];
  const lower = sorted[mid - 1];
  if (upper === undefined) return null;
  if (sorted.length % 2 === 1 || lower === undefined) return upper;
  return (lower + upper) / 2;
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
