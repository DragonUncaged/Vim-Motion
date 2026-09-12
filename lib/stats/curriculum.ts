import type { LessonCard, Module } from '@/content/types';

export interface LessonProgress {
  slug: string;
  title: string;
  keys: string[];
  exercises: number;
  solved: number;
  completion: number;
}

export interface ModuleProgress {
  id: string;
  name: string;
  blurb: string;
  accent: Module['accent'];
  lessons: LessonProgress[];
  exercises: number;
  solved: number;
  completion: number;
  lessonsComplete: number;
}

export function curriculumProgress(
  modules: Module[],
  lessonsByModule: Record<string, LessonCard[]>,
  solvedExercises: Set<string>,
): ModuleProgress[] {
  return [...modules]
    .sort((a, b) => a.order - b.order)
    .map((module) => {
      const lessons = (lessonsByModule[module.id] ?? []).map((lesson) => {
        const solved = lesson.exercises.filter((e) =>
          solvedExercises.has(`${lesson.slug}/${e.id}`),
        ).length;
        return {
          slug: lesson.slug,
          title: lesson.title,
          keys: lesson.keys,
          exercises: lesson.exercises.length,
          solved,
          completion: lesson.exercises.length === 0 ? 0 : solved / lesson.exercises.length,
        };
      });

      const exercises = lessons.reduce((sum, l) => sum + l.exercises, 0);
      const solved = lessons.reduce((sum, l) => sum + l.solved, 0);

      return {
        id: module.id,
        name: module.name,
        blurb: module.blurb,
        accent: module.accent,
        lessons,
        exercises,
        solved,
        completion: exercises === 0 ? 0 : solved / exercises,
        lessonsComplete: lessons.filter((l) => l.exercises > 0 && l.solved === l.exercises).length,
      };
    });
}

export function curriculumMotions(lessons: LessonCard[]): string[] {
  const motions = new Set<string>();
  for (const lesson of lessons) {
    for (const exercise of lesson.exercises) {
      for (const motion of exercise.motions) motions.add(motion);
    }
  }
  return [...motions].sort();
}

export function lessonsForMotion(lessons: LessonCard[], motion: string): LessonCard[] {
  return lessons.filter((lesson) =>
    lesson.exercises.some((exercise) => exercise.motions.includes(motion)),
  );
}
