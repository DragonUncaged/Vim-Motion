// Server-side only: importing this reaches content/lessons and bundles every lesson body.

import { catalogue } from '@/content/lessons';
import type { DrillItem } from './types';

export const drillPool: DrillItem[] = catalogue.flatMap((lesson) =>
  lesson.exercises.map((exercise) => ({
    key: `${lesson.slug}/${exercise.id}`,
    exerciseId: exercise.id,
    motions: exercise.motions,
    lessonSlug: lesson.slug,
    lessonTitle: lesson.title,
    moduleId: lesson.module,
    language: lesson.language,
  })),
);

export const allMotions: string[] = (() => {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const item of drillPool) {
    for (const motion of item.motions) {
      if (motion === '' || seen.has(motion)) continue;
      seen.add(motion);
      ordered.push(motion);
    }
  }
  return ordered;
})();
