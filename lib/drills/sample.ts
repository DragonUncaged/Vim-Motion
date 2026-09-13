// docs/CONTRACT.md §6. Mastery and weaknessWeight come from lib/stats; never recompute them here.

import { weaknessWeight } from '@/lib/stats/mastery';
import { mulberry32 } from './rng';
import type { DrillItem, MotionStanding } from './types';

export const RECENCY_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export const RECENCY_FLOOR = 0.3;

export const SIBLING_DAMPING = 0.45;

export const WEAKEST_EMPHASIS = 2;

export interface SampleInput {
  items: DrillItem[];
  mastery: Record<string, number | null>;
  lastSeen: ReadonlyMap<string, number>;
  now: number;
  count: number;
  seed: number;
  emphasis?: number;
}

export interface SampleResult {
  items: DrillItem[];
  targeted: MotionStanding[];
}

export function exerciseWeakness(item: DrillItem, mastery: Record<string, number | null>): number {
  const motions = item.motions.filter((m) => m !== '');
  if (motions.length === 0) return 1;
  let total = 0;
  for (const motion of motions) total += weaknessWeight(mastery[motion] ?? null);
  return total / motions.length;
}

export function recencyFactor(
  key: string,
  lastSeen: ReadonlyMap<string, number>,
  now: number,
): number {
  const seenAt = lastSeen.get(key);
  if (seenAt === undefined) return 1;
  const age = Math.max(0, now - seenAt);
  const fresh = Math.min(1, age / RECENCY_WINDOW_MS);
  return RECENCY_FLOOR + (1 - RECENCY_FLOOR) * fresh;
}

export function sampleDrill(input: SampleInput): SampleResult {
  const { items, mastery, lastSeen, now, count, seed, emphasis = 1 } = input;

  const pool = items.map((item) => {
    const base = exerciseWeakness(item, mastery) * recencyFactor(item.key, lastSeen, now);
    return { item, weight: Math.pow(base, emphasis) };
  });

  const rng = mulberry32(seed);
  const chosen: DrillItem[] = [];
  const wanted = Math.min(count, items.length);

  while (chosen.length < wanted && pool.length > 0) {
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0);

    let pick = pool.length - 1;
    if (total > 0) {
      let threshold = rng() * total;
      for (const [p, entry] of pool.entries()) {
        threshold -= entry.weight;
        if (threshold <= 0) {
          pick = p;
          break;
        }
      }
    } else {
      pick = Math.floor(rng() * pool.length);
    }

    const [drawn] = pool.splice(pick, 1);
    if (drawn === undefined) break;
    chosen.push(drawn.item);

    for (const entry of pool) {
      if (entry.item.lessonSlug === drawn.item.lessonSlug) entry.weight *= SIBLING_DAMPING;
    }
  }

  return { items: chosen, targeted: targetedMotions(chosen, mastery) };
}

const UNKNOWN_SORT = 55;

export function targetedMotions(
  items: DrillItem[],
  mastery: Record<string, number | null>,
): MotionStanding[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const motion of new Set(item.motions)) {
      if (motion === '') continue;
      counts.set(motion, (counts.get(motion) ?? 0) + 1);
    }
  }

  return [...counts.keys()]
    .map((motion) => {
      const score = mastery[motion];
      return {
        motion,
        mastery: score ?? undefined,
        inRun: counts.get(motion) ?? 0,
      };
    })
    .sort((a, b) => {
      const left = a.mastery ?? UNKNOWN_SORT;
      const right = b.mastery ?? UNKNOWN_SORT;
      return left - right || a.motion.localeCompare(b.motion);
    });
}
