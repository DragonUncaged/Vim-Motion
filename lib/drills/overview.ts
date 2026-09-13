import type { AttemptRecord } from '@/lib/progress';
import { motionAttemptCounts, motionMastery, UNPRACTISED_WEIGHT } from '@/lib/stats/mastery';
import { categories, itemsFor, motionsFor } from './categories';
import type { DrillCategory, DrillItem, MotionStanding } from './types';

export const UNRANKED_AS = 100 - (UNPRACTISED_WEIGHT - 1) * 25;

export interface CategoryOverview {
  category: DrillCategory;
  exerciseCount: number;
  motions: string[];
  mastery: number | null;
  practised: number;
  weakest: MotionStanding[];
}

export function categoryOverviews(
  pool: DrillItem[],
  attempts: AttemptRecord[],
  weakestLimit = 4,
): CategoryOverview[] {
  const mastery = motionMastery(attempts);
  const counts = motionAttemptCounts(attempts);

  const overviews = categories.map((category: DrillCategory): CategoryOverview => {
    const motions = motionsFor(pool, category);
    const known = motions
      .map((motion) => ({ motion, score: mastery[motion] }))
      .filter(
        (entry): entry is { motion: string; score: number } =>
          entry.score !== null && entry.score !== undefined,
      );

    const weakest: MotionStanding[] = [...known]
      .sort((a, b) => a.score - b.score || a.motion.localeCompare(b.motion))
      .slice(0, weakestLimit)
      .map((entry) => ({
        motion: entry.motion,
        mastery: entry.score,
        inRun: counts[entry.motion] ?? 0,
      }));

    return {
      category,
      exerciseCount: itemsFor(pool, category).length,
      motions,
      mastery:
        known.length === 0 ? null : known.reduce((sum, e) => sum + e.score, 0) / known.length,
      practised: known.length,
      weakest,
    };
  });

  return overviews
    .map((overview, position) => ({ overview, position }))
    .sort((a, b) => {
      const pinned =
        Number(b.overview.category.kind === 'weakest') -
        Number(a.overview.category.kind === 'weakest');
      if (pinned !== 0) return pinned;
      const left = a.overview.mastery ?? UNRANKED_AS;
      const right = b.overview.mastery ?? UNRANKED_AS;
      return left - right || a.position - b.position;
    })
    .map((entry) => entry.overview);
}
