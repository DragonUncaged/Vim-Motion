'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { ClayButton } from '@/components/clay/ClayButton';
import { ClayCard } from '@/components/clay/ClayCard';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { ClayRing } from '@/components/clay/ClayProgress';
import { Key } from '@/components/clay/Key';
import { RichText } from '@/components/prose/RichText';
import type { LessonCard, Module } from '@/content/types';
import { useProgress } from '@/lib/progress';

interface Counted {
  done: number;
  total: number;
  pct: number;
}

const count = (solved: Set<string>, lessons: LessonCard[]): Counted => {
  let done = 0;
  let total = 0;
  for (const lesson of lessons) {
    for (const e of lesson.exercises) {
      total += 1;
      if (solved.has(`${lesson.slug}/${e.id}`)) done += 1;
    }
  }
  return { done, total, pct: total === 0 ? 0 : (done / total) * 100 };
};

export interface CurriculumIndexProps {
  modules: Module[];
  lessons: LessonCard[];
  lessonsByModule: Record<string, LessonCard[]>;
}

export function CurriculumIndex({ modules, lessons, lessonsByModule }: CurriculumIndexProps) {
  const { solvedExercises, hydrated } = useProgress();
  const solved = useMemo(
    () => (hydrated ? solvedExercises : new Set<string>()),
    [hydrated, solvedExercises],
  );

  const overall = useMemo(() => count(solved, lessons), [solved, lessons]);

  const resume = useMemo(
    () => lessons.find((l) => count(solved, [l]).pct < 100) ?? lessons[0],
    [solved, lessons],
  );
  const started = overall.done > 0;

  return (
    <div className="flex flex-col gap-8 pt-4">
      <header className="flex flex-col gap-3">
        <h1 className="m-0">Lessons</h1>
        <p className="clay-prose m-0 text-lg">
          {modules.length} modules, in order — modes and hjkl through to real React, Go and C++
          files, then registers, macros and the global command.
        </p>
      </header>

      {resume !== undefined && (
        <ClayPanel
          hue="mint"
          size="hero"
          tint
          className="flex flex-wrap items-center gap-6 px-8 py-7"
        >
          <ClayRing
            value={overall.pct}
            hue="mint"
            size={84}
            label="of the whole curriculum complete"
          />
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-2xl">
              {started ? 'Pick up where you left off' : 'Start here'}
            </h2>
            <p className="clay-secondary mt-1 mb-0">
              {started
                ? `${overall.done} of ${overall.total} exercises done. Next up is ${resume.title}.`
                : 'Half an hour on the first module and vim stops looking like line noise.'}
            </p>
          </div>
          <ClayButton asChild intent="primary" hue="mint">
            <Link href={`/learn/${resume.slug}`}>
              {started ? `Continue with ${resume.title}` : `Begin with ${resume.title}`}
            </Link>
          </ClayButton>
        </ClayPanel>
      )}

      {modules.map((module) => {
        const lessons = lessonsByModule[module.id] ?? [];
        const hue = module.accent;
        const stats = count(solved, lessons);

        return (
          <ClayCard
            key={module.id}
            id={module.id}
            hue={hue}
            className="flex scroll-mt-6 flex-col gap-5 px-7 py-6"
          >
            <div className="flex items-start gap-5">
              <ClayRing
                value={stats.pct}
                hue={hue}
                size={68}
                label={`of ${module.name} complete`}
              />
              <div className="min-w-0 flex-1">
                <h2 className="m-0 text-2xl">{module.name}</h2>
                <p className="clay-secondary mt-1 mb-0">{module.blurb}</p>
              </div>
              <span className="clay-secondary hidden shrink-0 font-mono text-xs sm:block">
                {lessons.length} lesson{lessons.length === 1 ? '' : 's'}
              </span>
            </div>

            {lessons.length === 0 ? (
              <ClayPanel hue={hue} sunken size="chip" className="px-5 py-4">
                <p className="clay-secondary m-0 text-sm">These lessons are still being written.</p>
              </ClayPanel>
            ) : (
              <ul className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
                {lessons.map((lesson) => {
                  const l = count(solved, [lesson]);
                  return (
                    <li key={lesson.slug}>
                      <ClayCard hue={hue} pressable className="h-full p-0">
                        <Link
                          href={`/learn/${lesson.slug}`}
                          className="flex h-full flex-col gap-3 rounded-[inherit] px-5 py-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="m-0 text-base">{lesson.title}</h3>
                              <RichText as="p" className="clay-secondary mt-1 mb-0 text-sm">
                                {lesson.summary}
                              </RichText>
                            </div>
                            <ClayRing
                              value={l.pct}
                              hue={l.pct === 100 ? 'mint' : hue}
                              size={44}
                              strokeWidth={6}
                              label={`of ${lesson.title} complete`}
                            />
                          </div>
                          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                            {lesson.keys.map((k) => (
                              <Key key={k} label={k} hue={hue} size="sm" mastered={l.pct === 100} />
                            ))}
                            <span className="clay-secondary ml-auto font-mono text-xs">
                              {l.done}/{l.total}
                            </span>
                          </div>
                        </Link>
                      </ClayCard>
                    </li>
                  );
                })}
              </ul>
            )}
          </ClayCard>
        );
      })}
    </div>
  );
}
