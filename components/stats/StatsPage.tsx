'use client';

import { useMemo } from 'react';
import type { LessonCard, Module } from '@/content/types';
import { useProgress } from '@/lib/progress';
import { ClayPanel } from '@/components/clay/ClayPanel';
import {
  curriculumMotions,
  curriculumProgress,
  lessonsForMotion,
  motionAttemptCounts,
  motionMastery,
  sessions,
  summarise,
  weakestMotions,
} from '@/lib/stats';
import { CurriculumProgress } from './CurriculumProgress';
import { EmptyState } from './EmptyState';
import { HistoryChart } from './HistoryChart';
import { KeyboardHeatmap } from './KeyboardHeatmap';
import { StatTiles } from './StatTiles';
import { TransferPanel } from './TransferPanel';
import { WeakestMotions } from './WeakestMotions';

export interface StatsPageProps {
  modules: Module[];
  lessons: LessonCard[];
  lessonsByModule: Record<string, LessonCard[]>;
}

export function StatsPage({ modules, lessons, lessonsByModule }: StatsPageProps) {
  const { attempts, hydrated, storageOk, solvedExercises } = useProgress();

  const allMotions = useMemo(() => curriculumMotions(lessons), [lessons]);
  const firstLessonForMotion = useMemo(
    () =>
      new Map<string, LessonCard>(
        allMotions
          .map((motion) => [motion, lessonsForMotion(lessons, motion)[0]] as const)
          .filter((entry): entry is [string, LessonCard] => entry[1] !== undefined),
      ),
    [allMotions, lessons],
  );

  const summary = useMemo(() => summarise(attempts), [attempts]);
  const history = useMemo(() => sessions(attempts), [attempts]);
  const mastery = useMemo(() => motionMastery(attempts, allMotions), [attempts, allMotions]);
  const counts = useMemo(() => motionAttemptCounts(attempts), [attempts]);
  const weakest = useMemo(() => weakestMotions(mastery, counts, 5), [mastery, counts]);
  const curriculum = useMemo(
    () => curriculumProgress(modules, lessonsByModule, solvedExercises),
    [modules, lessonsByModule, solvedExercises],
  );

  const empty = attempts.length === 0;

  return (
    <div className="flex flex-col gap-8 pt-4 pb-4">
      <header className="flex flex-col gap-3">
        <h1 className="m-0">Stats</h1>
      </header>

      {hydrated && !storageOk && (
        <ClayPanel hue="butter" tint className="px-7 py-5" data-testid="storage-denied">
          <h2 className="m-0 text-lg">This browser will not store data</h2>
          <p className="clay-prose mt-2 mb-0 text-base">
            Nothing you solve can show up here. Allow site data, or use another browser, and
            attempts are recorded from then on.
          </p>
        </ClayPanel>
      )}

      <TransferPanel attempts={attempts.length} storageOk={storageOk} />

      {!hydrated ? (
        <>
          <ClayPanel hue="violet" className="flex min-h-[31rem] px-7 py-6" aria-busy="true">
            <p className="clay-secondary m-0 text-base">Reading your progress…</p>
          </ClayPanel>
          <KeyboardHeatmap mastery={mastery} counts={counts} />
          <CurriculumProgress modules={curriculum} />
        </>
      ) : empty ? (
        <>
          <EmptyState storageOk={storageOk} />
          <KeyboardHeatmap mastery={mastery} counts={counts} />
          <CurriculumProgress modules={curriculum} />
        </>
      ) : (
        <>
          <StatTiles summary={summary} />
          <HistoryChart sessions={history} />
          <KeyboardHeatmap mastery={mastery} counts={counts} />
          <WeakestMotions
            weakest={weakest}
            lessonForMotion={(motion) => firstLessonForMotion.get(motion)}
          />
          <CurriculumProgress modules={curriculum} />
        </>
      )}
    </div>
  );
}
