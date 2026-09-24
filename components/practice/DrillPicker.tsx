'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { ClayButton } from '@/components/clay/ClayButton';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { ClayRing } from '@/components/clay/ClayProgress';
import { Key, KeyRun } from '@/components/clay/Key';
import { useProgress } from '@/lib/progress';
import { MASTERED_AT, motionKeys, weakestMotions } from '@/lib/stats';
import { motionAttemptCounts, motionMastery } from '@/lib/stats/mastery';
import { percent, plural } from '@/lib/stats/format';
import { categoryOverviews, displayMotion, drillHref, speedrunHref } from '@/lib/drills';
import type { CategoryOverview, DrillItem } from '@/lib/drills';
import { masteryHue, MotionChip } from './TargetedMotions';

const MODES = [
  {
    href: drillHref('weakest'),
    hue: 'coral' as const,
    name: 'Drill',
    line: 'Ten exercises, timed, weighted towards whatever is going worst.',
    keys: ['d', 'w'],
  },
  {
    href: speedrunHref(),
    hue: 'butter' as const,
    name: 'Speedrun',
    line: 'One exercise against the clock, racing your own best time.',
    keys: ['f', 'f'],
  },
  {
    href: '/sandbox',
    hue: 'mint' as const,
    name: 'Sandbox',
    line: 'An editor with nothing to solve, and a panel that follows your keys.',
    keys: ['c', 'i'],
  },
];

function ModeCard({ mode }: { mode: (typeof MODES)[number] }) {
  return (
    <Link
      href={mode.href}
      className={`clay clay-card clay-press hue-${mode.hue} clay-focusable flex flex-col gap-3 px-6 py-6 no-underline`}
    >
      <span className="flex items-center gap-1.5">
        {mode.keys.map((k, i) => (
          <Key key={`${k}-${i}`} label={k} hue={mode.hue} live={false} />
        ))}
      </span>
      <span className="font-display text-xl font-semibold">{mode.name}</span>
      <span className="clay-prose text-sm">{mode.line}</span>
    </Link>
  );
}

const KIND_LABEL = {
  weakest: 'weighted across everything',
  group: 'motion family',
  module: 'module',
} as const;

function CategoryCard({ overview }: { overview: CategoryOverview }) {
  const { category, mastery, motions, practised, exerciseCount, weakest } = overview;
  const hue = mastery === null ? category.hue : masteryHue(mastery);
  const caps = weakest.length > 0 ? weakest.map((w) => w.motion) : motions.slice(0, 6);

  return (
    <li className="flex">
      <Link
        href={drillHref(category.id)}
        className={`clay clay-card clay-press hue-${hue} clay-focusable flex w-full flex-col gap-3 px-6 py-6 no-underline`}
      >
        <span className="flex items-start justify-between gap-3">
          <span className="flex min-w-0 flex-col gap-1">
            <span className="clay-secondary text-xs">{KIND_LABEL[category.kind]}</span>
            <span className="font-display text-lg font-semibold">{category.name}</span>
            <span className="clay-secondary text-xs">
              {plural(exerciseCount, 'exercise')} · {plural(motions.length, 'motion')}
            </span>
          </span>
          {mastery !== null && (
            <ClayRing value={mastery} hue={hue} size={54} label={`${category.name} mastery`} />
          )}
        </span>

        <span className="clay-prose text-sm">{category.blurb}</span>

        <span className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          {caps.map((motion) => (
            <KeyRun
              key={motion}
              keys={motionKeys(displayMotion(motion))}
              size="sm"
              live={false}
              hue={hue}
              mastered={mastery !== null && mastery >= MASTERED_AT}
            />
          ))}
        </span>

        {mastery !== null && (
          <span className="clay-secondary text-xs">
            {percent(mastery)} across {plural(practised, 'motion')} practised here.
          </span>
        )}
      </Link>
    </li>
  );
}

export function DrillPicker({ pool }: { pool: DrillItem[] }) {
  const { attempts, hydrated } = useProgress();

  const overviews = useMemo(() => categoryOverviews(pool, attempts), [pool, attempts]);
  const weakest = useMemo(
    () => weakestMotions(motionMastery(attempts), motionAttemptCounts(attempts), 6),
    [attempts],
  );

  const cold = hydrated && attempts.length === 0;
  const allStrong = weakest.length > 0 && weakest.every((w) => w.mastery >= MASTERED_AT);

  return (
    <div className="flex flex-col gap-10 pt-4">
      <header className="flex flex-col gap-3">
        <h1 className="m-0">Practice</h1>
        <p className="clay-prose m-0 text-lg">
          Short timed runs, weighted towards the motions you are worst at.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="m-0 text-xl">Three ways to practise</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map((mode) => (
            <ModeCard key={mode.name} mode={mode} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <ClayPanel hue="coral" tint className="flex flex-col gap-4 px-7 py-6">
          <div className="flex flex-col gap-2">
            <h2 className="m-0 text-xl">
              {weakest.length === 0
                ? 'Start anywhere'
                : allStrong
                  ? 'Nothing is going badly'
                  : 'Your weakest motions, first'}
            </h2>
            <p className="clay-prose m-0 text-base">
              {weakest.length > 0
                ? allStrong
                  ? `Everything you have practised is at ${MASTERED_AT} or better. These are the ` +
                    'weakest of the strong.'
                  : 'Worst first, from the same numbers the stats page shows.'
                : cold
                  ? 'Nothing ranked yet. A drill now spreads evenly across the curriculum.'
                  : 'Reading your history…'}
            </p>
          </div>

          {weakest.length > 0 && (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {weakest.map((entry) => (
                <li key={entry.motion}>
                  <MotionChip
                    standing={{
                      motion: entry.motion,
                      mastery: entry.mastery,
                      inRun: entry.attempts,
                    }}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <ClayButton asChild intent="primary" hue="coral">
              <Link href={drillHref('weakest')}>Drill my weakest</Link>
            </ClayButton>
            <ClayButton asChild intent="ghost">
              <Link href="/stats">See the full heatmap</Link>
            </ClayButton>
          </div>
        </ClayPanel>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="m-0 text-xl">Every category</h2>
          <p className="clay-prose m-0 text-base">
            {cold ? 'Nothing measured yet, so these are in curriculum order.' : 'Worst at the top.'}
          </p>
        </div>
        <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {overviews.map((overview) => (
            <CategoryCard key={overview.category.id} overview={overview} />
          ))}
        </ul>
      </section>
    </div>
  );
}
