import type { LessonCard } from '@/content/types';
import { motionFamily } from './mastery';

export interface LessonLink {
  slug: string;
  title: string;
  module: string;
}

/** A plain object, not a Map: it crosses the server/client boundary as a prop. */
export type MotionLessonIndex = Record<string, LessonLink>;

export function buildMotionLessonIndex(lessons: LessonCard[]): MotionLessonIndex {
  const index: MotionLessonIndex = {};

  const claim = (motion: string, lesson: LessonLink): void => {
    const family = motionFamily(motion);
    if (family === '' || family in index) return;
    index[family] = lesson;
  };

  for (const lesson of lessons) {
    const link: LessonLink = { slug: lesson.slug, title: lesson.title, module: lesson.module };
    for (const key of lesson.keys) claim(key, link);
    for (const exercise of lesson.exercises) {
      for (const motion of exercise.motions) claim(motion, link);
    }
  }

  return index;
}

export function lessonForMotion(
  index: MotionLessonIndex,
  motion: string | undefined,
): LessonLink | undefined {
  if (motion === undefined) return undefined;
  return index[motionFamily(motion)];
}
