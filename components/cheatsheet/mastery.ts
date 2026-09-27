import type { AttemptRecord } from '@/lib/progress';
import { MASTERED_AT, motionMastery } from '@/lib/stats';

/** The maths is lib/stats' (docs/CONTRACT.md §6, §8). */

export { MASTERED_AT };

/** Folds `dt,` onto `dt` (docs/CONTRACT.md §4); `ci"` and `ci{` must never merge. */
export function motionFamily(motion: string): string {
  const withOperator = /^([dcy=<>]|g[uU])?([fFtT])(.)$/.exec(motion);
  if (withOperator !== null) return `${withOperator[1] ?? ''}${withOperator[2]}`;
  return motion;
}

export function masteryByMotion(attempts: AttemptRecord[]): Map<string, number> {
  const byFamily: AttemptRecord[] = attempts.map((attempt) => ({
    ...attempt,
    motions: [...new Set(attempt.motions.map(motionFamily))],
  }));

  const mastery = new Map<string, number>();
  for (const [motion, value] of Object.entries(motionMastery(byFamily))) {
    if (value !== null) mastery.set(motion, Math.round(value));
  }
  return mastery;
}
