import type { Lesson, LessonCard, Module, ModuleId } from '../types';
import { modules } from '../modules';
import { lessons as basicsLessons } from './basics';
import { lessons as operatorsLessons } from './operators';
import { lessons as reactTsxLessons } from './react-tsx';
import { lessons as goLessons } from './go';

const inOrder = (lessons: Lesson[]): Lesson[] => [...lessons].sort((a, b) => a.order - b.order);

export const lessonsByModule: Record<ModuleId, Lesson[]> = {
  basics: inOrder(basicsLessons),
  operators: inOrder(operatorsLessons),
  'react-tsx': inOrder(reactTsxLessons),
  go: inOrder(goLessons),
};

const orderedModules: Module[] = [...modules].sort((a, b) => a.order - b.order);

const ordered: Lesson[] = orderedModules.flatMap((m) => lessonsByModule[m.id]);

function assertRegistryIsSound(): void {
  const seen = new Map<string, string>();
  for (const lesson of ordered) {
    const previous = seen.get(lesson.slug);
    if (previous !== undefined) {
      throw new Error(
        `Duplicate lesson slug "${lesson.slug}" — used by both ${previous} and ${lesson.module}. ` +
          'Slugs are URL segments and must be unique across the whole site.',
      );
    }
    seen.set(lesson.slug, lesson.module);
  }

  for (const m of orderedModules) {
    const inModule = lessonsByModule[m.id];
    if (inModule.length === 0) {
      throw new Error(
        `Module "${m.id}" has no lessons. A module card with nothing behind it is a dead ` +
          'end for a learner; either give it a lesson or take it out of content/modules.ts.',
      );
    }
    inModule.forEach((lesson, i) => {
      if (lesson.order !== i + 1) {
        throw new Error(
          `Module "${m.id}" has a hole in its ordering: expected order ${i + 1} at position ` +
            `${i}, found ${lesson.order} on "${lesson.slug}". Orders must be 1-based and dense.`,
        );
      }
      if (lesson.module !== m.id) {
        throw new Error(
          `Lesson "${lesson.slug}" lives in the ${m.id} barrel but declares module ` +
            `"${lesson.module}".`,
        );
      }
      if (lesson.exercises.some((e) => e.motions.length === 0)) {
        throw new Error(
          `Lesson "${lesson.slug}" has an exercise with an empty motions[] — mastery and the ` +
            'drill sampler both need at least one motion.',
        );
      }
    });
  }
}

assertRegistryIsSound();

export const allLessons: Lesson[] = ordered;

export { modules };

export const catalogue: LessonCard[] = ordered.map((lesson) => ({
  slug: lesson.slug,
  title: lesson.title,
  module: lesson.module,
  order: lesson.order,
  keys: lesson.keys,
  summary: lesson.summary,
  language: lesson.language,
  exercises: lesson.exercises.map((exercise) => ({
    id: exercise.id,
    motions: exercise.motions,
  })),
}));

export const catalogueByModule: Record<string, LessonCard[]> = Object.fromEntries(
  orderedModules.map((m) => [m.id, catalogue.filter((lesson) => lesson.module === m.id)]),
);

const indexBySlug = new Map<string, number>(ordered.map((l, i) => [l.slug, i]));

export function lessonBySlug(slug: string): Lesson | undefined {
  const i = indexBySlug.get(slug);
  return i === undefined ? undefined : ordered[i];
}

export function nextLesson(slug: string): Lesson | undefined {
  const i = indexBySlug.get(slug);
  return i === undefined ? undefined : ordered[i + 1];
}

export function prevLesson(slug: string): Lesson | undefined {
  const i = indexBySlug.get(slug);
  return i === undefined || i === 0 ? undefined : ordered[i - 1];
}
