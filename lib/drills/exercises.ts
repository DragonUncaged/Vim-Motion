import type { Exercise } from '@/content/types';
import type { DrillItem, LoadedDrillItem } from './types';

let bodies: Map<string, Exercise> | null = null;

let inFlight: Promise<Map<string, Exercise>> | null = null;

async function fetchBodies(): Promise<Map<string, Exercise>> {
  if (bodies !== null) return bodies;
  inFlight ??= import('@/content/lessons')
    .then(({ allLessons }) => {
      const map = new Map<string, Exercise>();
      for (const lesson of allLessons) {
        for (const exercise of lesson.exercises) map.set(`${lesson.slug}/${exercise.id}`, exercise);
      }
      bodies = map;
      return map;
    })
    .catch((error: unknown) => {
      inFlight = null;
      throw error;
    });
  return inFlight;
}

export function exercisesLoaded(): boolean {
  return bodies !== null;
}

export async function loadDrillItems(items: DrillItem[]): Promise<LoadedDrillItem[] | null> {
  const map = await fetchBodies();
  const loaded: LoadedDrillItem[] = [];
  for (const item of items) {
    const exercise = map.get(item.key);
    if (exercise === undefined) return null;
    loaded.push({ ...item, exercise });
  }
  return loaded;
}
