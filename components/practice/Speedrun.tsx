'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ClayButton } from '@/components/clay/ClayButton';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { KeyRun } from '@/components/clay/Key';
import { ExercisePlaceholder } from '@/components/ExercisePlaceholder';
import { useIsWideScreen } from '@/components/hooks/useIsWideScreen';
import { motionKeys } from '@/lib/stats';
import { duration, percent, plural } from '@/lib/stats/format';
import { useProgress } from '@/lib/progress';
import {
  displayMotion,
  drillHref,
  itemByKey,
  loadDrillItems,
  newSeed,
  personalBest,
  pickSpeedrunItem,
  speedrunHref,
} from '@/lib/drills';
import type { DrillItem, DrillResult, LoadedDrillItem, PersonalBest } from '@/lib/drills';
import { ExerciseStage } from './ExerciseStage';
import { GhostRace } from './GhostRace';
import { NeedsKeyboard } from './NeedsKeyboard';

function beaten(result: DrillResult | null, bestMs: number): result is DrillResult {
  return result !== null && result.reached && result.timeMs < bestMs;
}

export function Speedrun({ itemKey, pool }: { itemKey: string | null; pool: DrillItem[] }) {
  const { attempts, hydrated } = useProgress();
  const wide = useIsWideScreen();

  const [seed, setSeed] = useState<number | null>(null);
  const [run, setRun] = useState<{
    item: LoadedDrillItem;
    best: PersonalBest | null;
    nonce: number;
  } | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [lastResult, setLastResult] = useState<DrillResult | null>(null);

  const attemptsRef = useRef(attempts);
  attemptsRef.current = attempts;

  /** Freeze the ghost at start, or the run becomes its own ghost the moment it is solved. */
  const begin = useCallback(
    (nextSeed: number, cancelled: () => boolean = () => false) => {
      const history = attemptsRef.current;
      const chosen =
        (itemKey === null ? undefined : itemByKey(pool, itemKey)) ??
        pickSpeedrunItem(pool, { attempts: history, seed: nextSeed, now: Date.now() });
      if (chosen === null) return Promise.resolve();
      return loadDrillItems([chosen]).then((loaded) => {
        const item = loaded?.[0];
        if (cancelled() || item === undefined) return;
        setLastResult(null);
        setRun({ item, best: personalBest(history, chosen.key), nonce: nextSeed });
      });
    },
    [itemKey, pool],
  );

  /** Not begin(newSeed()): re-rolling picks a different exercise and the ghost is never met. */
  const again = useCallback(() => {
    setLastResult(null);
    setRun((current) =>
      current === null
        ? current
        : {
            item: current.item,
            best: personalBest(attemptsRef.current, current.item.key),
            nonce: newSeed(),
          },
    );
  }, []);

  useEffect(() => {
    setRun(null);
    setSeed(newSeed());
  }, [itemKey]);

  useEffect(() => {
    if (seed === null || !hydrated || run !== null) return;
    let cancelled = false;
    void begin(seed, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [seed, hydrated, run, begin]);

  const handleFinished = useCallback((next: DrillResult) => {
    setLastResult(next);
    setAnnouncement(
      next.reached
        ? `Solved in ${(next.timeMs / 1000).toFixed(1)} seconds.`
        : 'Attempt ended without reaching the outcome.',
    );
  }, []);

  const ready = hydrated && run !== null;
  const item = run?.item;
  const best = run?.best ?? null;
  /* Read here: inside beaten()'s else the compiler narrows lastResult to null, which it is not. */
  const justSolved = lastResult?.reached === true;

  return (
    <div className="flex flex-col gap-6 pt-4">
      <header className="flex flex-col gap-3">
        <p className="clay-secondary m-0 text-sm">Speedrun · one exercise, against the clock</p>
        <h1 className="m-0">{item?.lessonTitle ?? 'Speedrun'}</h1>
        <div className="flex min-h-[2.75rem] flex-wrap items-center gap-2">
          {item?.motions.map((motion) => (
            <KeyRun
              key={motion}
              keys={motionKeys(displayMotion(motion))}
              live={false}
              hue="butter"
            />
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0">
          {!ready || item === undefined || wide === null ? (
            <ExercisePlaceholder className="lg:min-h-[41rem]" />
          ) : wide ? (
            <ExerciseStage
              key={`${item.key}:${run.nonce}`}
              item={item}
              onFinished={handleFinished}
              announce={setAnnouncement}
              renderTop={(state, solved) => (
                <ClayPanel hue={solved ? 'mint' : 'butter'} className="px-6 py-5">
                  <GhostRace
                    attempt={state}
                    bestMs={best?.timeMs ?? null}
                    ghost={best?.timeline ?? null}
                    finished={state.status === 'solved' || state.status === 'failed'}
                    solved={state.status === 'solved'}
                  />
                </ClayPanel>
              )}
              renderFinished={(finishedResult) => {
                // Read the argument, not parent state, which is a frame behind.
                const beatIt =
                  finishedResult.reached && (best === null || finishedResult.timeMs < best.timeMs);
                return (
                  <ClayPanel
                    hue={finishedResult.reached ? 'mint' : 'coral'}
                    tint
                    className="flex flex-col gap-4 px-6 py-5"
                  >
                    <h2 className="m-0 text-xl">
                      {!finishedResult.reached
                        ? 'Outcome not reached'
                        : beatIt && best !== null
                          ? 'New personal best'
                          : beatIt
                            ? 'That is your ghost set'
                            : 'Your best still stands'}
                    </h2>
                    <dl className="m-0 grid grid-cols-2 gap-4 sm:grid-cols-3">
                      <div className="flex flex-col gap-0.5">
                        <dd className="m-0 font-mono text-xl font-bold tabular-nums">
                          {duration(finishedResult.timeMs)}
                        </dd>
                        <dt className="clay-secondary text-xs">this run</dt>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <dd className="m-0 font-mono text-xl font-bold tabular-nums">
                          {finishedResult.keystrokes} of {finishedResult.par}
                        </dd>
                        <dt className="clay-secondary text-xs">keystrokes against par</dt>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <dd className="m-0 font-mono text-xl font-bold tabular-nums">
                          {percent(finishedResult.efficiency)}
                        </dd>
                        <dt className="clay-secondary text-xs">efficiency</dt>
                      </div>
                    </dl>
                    <div className="flex flex-wrap gap-3">
                      <ClayButton intent="primary" hue="butter" onClick={again}>
                        Run it again
                      </ClayButton>
                      <ClayButton asChild intent="secondary">
                        <Link href={speedrunHref()}>Race a different exercise</Link>
                      </ClayButton>
                      <ClayButton asChild intent="ghost">
                        <Link href={`/learn/${item.lessonSlug}`}>Back to the lesson</Link>
                      </ClayButton>
                    </div>
                  </ClayPanel>
                );
              }}
            />
          ) : (
            <NeedsKeyboard
              title="One exercise, against your own best time"
              motions={item.motions}
              lessonSlug={item.lessonSlug}
            />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <ClayPanel hue="violet" className="flex flex-col gap-3 px-6 py-5">
            <h2 className="m-0 text-lg">Your record here</h2>
            {!ready || item === undefined ? (
              <p className="clay-prose m-0 text-sm">Looking up your best time…</p>
            ) : best === null ? (
              lastResult?.reached ? (
                <p className="clay-prose m-0 text-sm">
                  You raced nobody. Your {duration(lastResult.timeMs)} is now the time to beat.
                </p>
              ) : (
                <p className="clay-prose m-0 text-sm">
                  No solved run yet. Par is {plural(item.exercise.par, 'keystroke')}.
                </p>
              )
            ) : (
              <>
                <dl className="m-0 grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-0.5">
                    <dd className="m-0 font-mono text-xl font-bold tabular-nums">
                      {duration(best.timeMs)}
                    </dd>
                    <dt className="clay-secondary text-xs">
                      {beaten(lastResult, best.timeMs) ? 'the ghost you raced' : 'your best'}
                    </dt>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dd className="m-0 font-mono text-xl font-bold tabular-nums">
                      {best.keystrokes} of {item.exercise.par}
                    </dd>
                    <dt className="clay-secondary text-xs">keys on that run</dt>
                  </div>
                </dl>
                {beaten(lastResult, best.timeMs) ? (
                  <p className="clay-secondary m-0 text-xs">
                    Beaten just now, by {duration(best.timeMs - lastResult.timeMs)}.
                  </p>
                ) : (
                  <p className="clay-secondary m-0 text-xs">
                    {/* best is frozen at run start, so the count adds the run that just ended. */}
                    {plural(best.runs + (justSolved ? 1 : 0), 'solved run')} on record.
                  </p>
                )}
              </>
            )}
          </ClayPanel>

          <ClayPanel hue="butter" className="flex flex-col gap-3 px-6 py-5">
            <h2 className="m-0 text-lg">Rather drill?</h2>
            <p className="clay-prose m-0 text-sm">
              Ten exercises, weighted towards whatever is going worst.
            </p>
            <div className="flex flex-wrap gap-2">
              <ClayButton asChild intent="secondary" hue="coral">
                <Link href={drillHref('weakest')}>Drill my weakest</Link>
              </ClayButton>
              <ClayButton asChild intent="ghost">
                <Link href="/practice">All categories</Link>
              </ClayButton>
            </div>
          </ClayPanel>
        </div>
      </div>

      <div className="clay-sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </div>
  );
}
