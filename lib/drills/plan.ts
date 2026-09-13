import type { AttemptRecord } from '@/lib/progress';
import { motionMastery } from '@/lib/stats/mastery';
import { categoryById, itemsFor, motionsFor, WEAKEST } from './categories';
import { sampleDrill, WEAKEST_EMPHASIS } from './sample';
import type { DrillCategory, DrillPlan, DrillItem } from './types';

export const DRILL_LENGTH = 10;

export function lastSeenByExercise(attempts: AttemptRecord[]): Map<string, number> {
  const seen = new Map<string, number>();
  for (const a of attempts) {
    const key = `${a.lessonSlug}/${a.exerciseId}`;
    const previous = seen.get(key);
    if (previous === undefined || a.at > previous) seen.set(key, a.at);
  }
  return seen;
}

export interface PlanInput {
  categoryId: string;
  attempts: AttemptRecord[];
  seed: number;
  now: number;
  count?: number;
}

export function planDrill(pool: DrillItem[], input: PlanInput): DrillPlan | null {
  const category = categoryById(input.categoryId);
  if (category === undefined) return null;
  return planFor(pool, category, input);
}

export function planFor(
  pool: DrillItem[],
  category: DrillCategory,
  input: Omit<PlanInput, 'categoryId'>,
): DrillPlan {
  const { attempts, seed, now, count = DRILL_LENGTH } = input;
  const items = itemsFor(pool, category);

  const mastery = motionMastery(attempts, motionsFor(pool, category));

  const { items: chosen, targeted } = sampleDrill({
    items,
    mastery,
    lastSeen: lastSeenByExercise(attempts),
    now,
    count,
    seed,
    emphasis: category.kind === 'weakest' ? WEAKEST_EMPHASIS : 1,
  });

  return {
    category,
    seed,
    items: chosen,
    targeted,
    poolSize: items.length,
    cold: attempts.length === 0,
  };
}

export function planWeakest(pool: DrillItem[], input: Omit<PlanInput, 'categoryId'>): DrillPlan {
  return planFor(pool, WEAKEST, input);
}

export function pickSpeedrunItem(
  pool: DrillItem[],
  input: Omit<PlanInput, 'categoryId'>,
): DrillItem | null {
  return planFor(pool, WEAKEST, { ...input, count: 1 }).items[0] ?? null;
}
