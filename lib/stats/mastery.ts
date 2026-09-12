/**
 * docs/CONTRACT.md §6. The formula, written down only here:
 *   score = unsolved ? 0 : (0.6 * efficiency + 0.4 * accuracy * 100) * (keystrokes > 2x par ? 0.7 : 1)
 *   mastery(motion) = mean score over the last 5 attempts listing it, or null (never 0) when there are none.
 */

import type { AttemptRecord } from '@/lib/progress';
import { attemptAccuracy, attemptEfficiency, exceededPar } from './metrics';

/** docs/CONTRACT.md §6 */
export const MASTERY_WINDOW = 5;

export const EFFICIENCY_WEIGHT = 0.6;
export const ACCURACY_WEIGHT = 0.4;

export const OVER_PAR_PENALTY = 0.7;

export const MASTERED_AT = 80;

export function scoreAttempt(a: AttemptRecord): number {
  if (!a.solved) return 0;
  const raw = EFFICIENCY_WEIGHT * attemptEfficiency(a) + ACCURACY_WEIGHT * attemptAccuracy(a) * 100;
  const penalised = exceededPar(a) ? raw * OVER_PAR_PENALTY : raw;
  return Math.max(0, Math.min(100, penalised));
}

export function motionMastery(
  attempts: AttemptRecord[],
  knownMotions: Iterable<string> = [],
): Record<string, number | null> {
  const result: Record<string, number | null> = {};
  for (const motion of knownMotions) result[motion] = null;

  const ordered = [...attempts].sort((a, b) => b.at - a.at);
  const window = new Map<string, number[]>();

  for (const attempt of ordered) {
    const score = scoreAttempt(attempt);
    // docs/CONTRACT.md §6
    for (const motion of new Set(attempt.motions)) {
      let scores = window.get(motion);
      if (scores === undefined) {
        scores = [];
        window.set(motion, scores);
      }
      if (scores.length < MASTERY_WINDOW) scores.push(score);
    }
  }

  for (const [motion, scores] of window) {
    result[motion] = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  }
  return result;
}

export function motionAttemptCounts(attempts: AttemptRecord[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const attempt of attempts) {
    for (const motion of new Set(attempt.motions)) {
      counts[motion] = (counts[motion] ?? 0) + 1;
    }
  }
  return counts;
}

export const UNPRACTISED_WEIGHT = 3;

export function weaknessWeight(mastery: number | null): number {
  if (mastery === null) return UNPRACTISED_WEIGHT;
  const clamped = Math.max(0, Math.min(100, mastery));
  return 1 + (100 - clamped) / 25;
}

export interface MotionMastery {
  motion: string;
  mastery: number;
  attempts: number;
}

export function weakestMotions(
  mastery: Record<string, number | null>,
  counts: Record<string, number> = {},
  limit = 5,
): MotionMastery[] {
  return Object.entries(mastery)
    .filter((entry): entry is [string, number] => entry[1] !== null)
    .map(([motion, score]) => ({ motion, mastery: score, attempts: counts[motion] ?? 0 }))
    .sort((a, b) => a.mastery - b.mastery || a.motion.localeCompare(b.motion))
    .slice(0, limit);
}
