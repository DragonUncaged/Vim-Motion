'use client';

/** The plan and the mastery snapshot freeze at run start so the run cannot re-weight itself. */

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ClayButton } from '@/components/clay/ClayButton';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { ClayBar } from '@/components/clay/ClayProgress';
import { ExercisePlaceholder } from '@/components/ExercisePlaceholder';
import { useIsWideScreen } from '@/components/hooks/useIsWideScreen';
import { motionMastery } from '@/lib/stats';
import { duration } from '@/lib/stats/format';
import { useProgress } from '@/lib/progress';
import {
  DRILL_LENGTH,
  drillHref,
  loadDrillItems,
  newSeed,
  planFor,
  speedrunHref,
} from '@/lib/drills';
import type {
  DrillCategory,
  DrillItem,
  DrillPlan,
  DrillResult,
  LoadedDrillItem,
} from '@/lib/drills';
import { ExerciseStage } from './ExerciseStage';
import { ResultStrip, type MasteryMove } from './ResultStrip';
import { NeedsKeyboard } from './NeedsKeyboard';
import { TargetedMotions } from './TargetedMotions';

/** Matches the .clay-puff animation. */
const PUFF_MS = 900;

export function DrillSession({ category, pool }: { category: DrillCategory; pool: DrillItem[] }) {
  const { attempts, hydrated } = useProgress();
  const wide = useIsWideScreen();

  // After mount: newSeed() reads the clock and would break hydration.
  const [seed, setSeed] = useState<number | null>(null);

  const [run, setRun] = useState<{
    plan: DrillPlan;
    items: LoadedDrillItem[];
    before: Record<string, number | null>;
  } | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<DrillResult[]>([]);
  const [held, setHeld] = useState<DrillResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [announcement, setAnnouncement] = useState('');

  const attemptsRef = useRef(attempts);
  attemptsRef.current = attempts;

  const start = useCallback(
    (nextSeed: number, cancelled: () => boolean = () => false) => {
      const history = attemptsRef.current;
      const plan = planFor(pool, category, { attempts: history, seed: nextSeed, now: Date.now() });
      const motions = plan.targeted.map((t) => t.motion);
      const before = motionMastery(history, motions);
      return loadDrillItems(plan.items).then((items) => {
        if (cancelled() || items === null) return;
        setRun({ plan, items, before });
        setIndex(0);
        setResults([]);
        setHeld(null);
        setAttempt(0);
      });
    },
    [category, pool],
  );

  useEffect(() => {
    if (seed === null || !hydrated || run !== null) return;
    let cancelled = false;
    void start(seed, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [seed, hydrated, run, start]);

  useEffect(() => {
    setRun(null);
    setSeed(newSeed());
  }, [category.id]);

  const advance = useCallback((result: DrillResult) => {
    setResults((r) => [...r, result]);
    setHeld(null);
    setIndex((i) => i + 1);
  }, []);

  const retry = useCallback(() => {
    setHeld(null);
    setAttempt((n) => n + 1);
  }, []);

  const handleFinished = useCallback((result: DrillResult) => {
    setHeld(result);
    setAnnouncement(
      result.reached
        ? `Solved in ${(result.timeMs / 1000).toFixed(1)} seconds. Next exercise.`
        : 'Moved on. Next exercise.',
    );
  }, []);

  useEffect(() => {
    if (held === null || held.outcome === 'failed') return;
    const id = window.setTimeout(() => advance(held), held.outcome === 'solved' ? PUFF_MS : 0);
    return () => window.clearTimeout(id);
  }, [held, advance]);

  const moves: MasteryMove[] = useMemo(() => {
    if (run === null) return [];
    const motions = run.plan.targeted.map((t) => t.motion);
    const after = motionMastery(attempts, motions);
    return motions
      .map((motion) => ({
        motion,
        before: run.before[motion] ?? null,
        after: after[motion] ?? null,
      }))
      .filter(
        (m) =>
          Math.abs((m.after ?? 0) - (m.before ?? 0)) > 0.5 ||
          (m.before === null && m.after !== null),
      )
      .sort((a, b) => (b.after ?? 0) - (b.before ?? 0) - ((a.after ?? 0) - (a.before ?? 0)));
  }, [run, attempts]);

  const ready = hydrated && run !== null;
  const plan = run?.plan;
  const total = plan?.items.length ?? 0;
  const finished = ready && index >= total;
  const item = run?.items[index];
  const elapsed = results.reduce((sum, r) => sum + (r.reached ? r.timeMs : 0), 0);

  if (ready && total === 0) {
    return (
      <ClayPanel hue="coral" className="px-7 py-6">
        <h1 className="m-0 text-2xl">{category.name}</h1>
        <p className="clay-prose mt-2 text-base">No exercises in this category yet.</p>
        <ClayButton asChild intent="primary" className="mt-4">
          <Link href="/practice">Back to practice</Link>
        </ClayButton>
      </ClayPanel>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <header className="flex flex-col gap-3">
        <p className="clay-secondary m-0 text-sm">
          Drill · {total === DRILL_LENGTH ? 'ten exercises' : `${total} exercises`}, timed
        </p>
        <h1 className="m-0">{category.name}</h1>
        <p className="clay-prose m-0 text-lg">{category.blurb}</p>
      </header>

      {wide !== false && !(ready && wide === true && plan !== undefined) && (
        <ClayPanel
          hue="blue"
          className="hidden flex-col gap-3 px-6 py-5 lg:flex"
          aria-hidden="true"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="text-lg font-bold">Building your run…</span>
            <span className="clay-secondary font-mono text-sm tabular-nums">
              {duration(0)} on the clock
            </span>
          </div>
          <ClayBar value={0} hue="blue" label="0 exercises done" />
        </ClayPanel>
      )}

      {ready && wide === true && plan !== undefined && (
        <ClayPanel hue="blue" className="flex flex-col gap-3 px-6 py-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="text-lg font-bold">
              {finished ? 'Run complete' : `Exercise ${index + 1} of ${total}`}
            </span>
            <span className="clay-secondary font-mono text-sm tabular-nums">
              {duration(elapsed)} on the clock
            </span>
          </div>
          <ClayBar
            value={(index / total) * 100}
            hue={finished ? 'mint' : 'blue'}
            label={`${index} of ${total} exercises done`}
          />
          {total < DRILL_LENGTH && !finished && (
            <p className="clay-secondary m-0 text-xs">
              All {plan.poolSize} exercise{plan.poolSize === 1 ? '' : 's'} in this category.
            </p>
          )}
        </ClayPanel>
      )}

      {!ready || plan === undefined ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
          <div className="min-w-0">
            <ExercisePlaceholder className="lg:min-h-[40rem]" />
          </div>
        </div>
      ) : finished ? (
        <>
          <ResultStrip results={results} moves={moves} />
          <div className="flex flex-wrap gap-3">
            <ClayButton intent="primary" hue="mint" onClick={() => void start(newSeed())}>
              Run it again
            </ClayButton>
            {category.kind !== 'weakest' && (
              <ClayButton asChild intent="secondary" hue="coral">
                <Link href={drillHref('weakest')}>Drill my weakest</Link>
              </ClayButton>
            )}
            <ClayButton asChild intent="ghost">
              <Link href={speedrunHref()}>Try a speedrun</Link>
            </ClayButton>
            <ClayButton asChild intent="ghost">
              <Link href="/practice">Pick another category</Link>
            </ClayButton>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
          <div className="min-w-0">
            {wide === null ? (
              <ExercisePlaceholder className="lg:min-h-[40rem]" />
            ) : wide && item !== undefined ? (
              <ExerciseStage
                key={`${item.key}:${attempt}`}
                item={item}
                onFinished={handleFinished}
                announce={setAnnouncement}
                renderFinished={(finishedResult) =>
                  finishedResult.outcome === 'failed' ? (
                    <div className="flex flex-wrap gap-2">
                      <ClayButton intent="secondary" onClick={retry}>
                        Try this one again
                      </ClayButton>
                      <ClayButton
                        intent="primary"
                        hue="mint"
                        onClick={() => advance(finishedResult)}
                      >
                        Next exercise
                      </ClayButton>
                    </div>
                  ) : null
                }
              />
            ) : (
              <NeedsKeyboard
                title={`${category.name}, ten exercises at a time`}
                motions={plan.targeted.map((t) => t.motion)}
              />
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            {wide === true && <TargetedMotions standings={plan.targeted} cold={plan.cold} />}
          </div>
        </div>
      )}

      <div className="clay-sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </div>
  );
}
