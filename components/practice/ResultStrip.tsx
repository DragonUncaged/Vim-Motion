'use client';

/** Par is never a limit (docs/CONTRACT.md §4 rule 2). */

import { KeyRun } from '@/components/clay/Key';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { RichText } from '@/components/prose/RichText';
import { motionKeys } from '@/lib/stats';
import { duration, percent } from '@/lib/stats/format';
import { displayMotion, type DrillResult } from '@/lib/drills';
import { masteryHue } from './TargetedMotions';

export interface MasteryMove {
  motion: string;
  before: number | null;
  after: number | null;
}

function Row({ result, index }: { result: DrillResult; index: number }) {
  const { item, reached } = result;
  const overPar = result.keystrokes > result.par;

  return (
    <li
      className={`clay clay-chip hue-${reached ? 'mint' : 'coral'} ${reached ? 'clay-tint' : ''} grid grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2 px-4 py-3 sm:grid-cols-[1.75rem_minmax(0,1fr)_5rem_6rem_4.5rem] sm:items-center`}
    >
      <span className="clay-secondary font-mono text-xs font-bold">{index + 1}</span>

      <span className="flex min-w-0 flex-col gap-1.5">
        <RichText as="span" className="clay-prose text-sm">
          {item.exercise.prompt}
        </RichText>
        <span className="clay-secondary flex flex-wrap items-center gap-1.5 text-xs">
          <span>{item.lessonTitle}</span>
          {item.motions.slice(0, 3).map((motion) => (
            <KeyRun key={motion} keys={motionKeys(displayMotion(motion))} size="sm" live={false} />
          ))}
        </span>
      </span>

      <span className="col-start-2 font-mono text-sm tabular-nums sm:col-start-3">
        <span className="clay-secondary text-xs sm:hidden">time </span>
        {reached ? duration(result.timeMs) : '—'}
      </span>

      <span className="col-start-2 font-mono text-sm tabular-nums sm:col-start-4">
        <span className="clay-secondary text-xs sm:hidden">keys </span>
        {result.keystrokes} of {result.par}
        {overPar && reached && <span className="clay-secondary"> · long way</span>}
      </span>

      <span className="col-start-2 text-sm sm:col-start-5 sm:text-right">
        {reached ? 'reached' : result.outcome === 'skipped' ? 'skipped' : 'ended early'}
      </span>
    </li>
  );
}

export function ResultStrip({
  results,
  moves,
}: {
  results: DrillResult[];
  /** Only motions whose mastery changed over the run. */
  moves: MasteryMove[];
}) {
  const reached = results.filter((r) => r.reached);
  const totalMs = reached.reduce((sum, r) => sum + r.timeMs, 0);
  const totalKeys = results.reduce((sum, r) => sum + r.keystrokes, 0);
  const totalPar = results.reduce((sum, r) => sum + r.par, 0);
  const meanEfficiency =
    reached.length === 0 ? null : reached.reduce((s, r) => s + r.efficiency, 0) / reached.length;
  const meanAccuracy =
    reached.length === 0 ? null : reached.reduce((s, r) => s + r.accuracy, 0) / reached.length;

  return (
    <div className="flex flex-col gap-5">
      <ClayPanel hue="mint" tint className="px-7 py-6">
        <h2 className="m-0 text-2xl">
          {reached.length} of {results.length} reached
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-0.5">
            <dd className="m-0 font-mono text-xl font-bold tabular-nums">{duration(totalMs)}</dd>
            <dt className="clay-secondary text-xs">time on the clock</dt>
          </div>
          <div className="flex flex-col gap-0.5">
            <dd className="m-0 font-mono text-xl font-bold tabular-nums">
              {totalKeys} of {totalPar}
            </dd>
            <dt className="clay-secondary text-xs">keystrokes against par</dt>
          </div>
          <div className="flex flex-col gap-0.5">
            <dd className="m-0 font-mono text-xl font-bold tabular-nums">
              {percent(meanEfficiency)}
            </dd>
            <dt className="clay-secondary text-xs">mean efficiency</dt>
          </div>
          <div className="flex flex-col gap-0.5">
            <dd className="m-0 font-mono text-xl font-bold tabular-nums">
              {meanAccuracy === null ? '—' : percent(meanAccuracy * 100)}
            </dd>
            <dt className="clay-secondary text-xs">mean accuracy</dt>
          </div>
        </dl>
      </ClayPanel>

      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {results.map((result, i) => (
          <Row key={result.item.key} result={result} index={i} />
        ))}
      </ol>

      <ClayPanel hue="violet" className="px-7 py-6">
        <h2 className="m-0 text-lg">What moved</h2>
        {moves.length === 0 ? (
          <p className="clay-prose mt-2 mb-0 text-sm">
            Nothing shifted. Mastery averages your last five attempts at a motion, so it takes a few
            runs.
          </p>
        ) : (
          <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
            {moves.map((move) => {
              const rose = (move.after ?? 0) >= (move.before ?? 0);
              return (
                <li
                  key={move.motion}
                  className={`clay clay-chip clay-tint hue-${masteryHue(move.after ?? undefined)} flex items-center gap-2 px-3 py-1.5`}
                >
                  <KeyRun keys={motionKeys(displayMotion(move.motion))} size="sm" live={false} />
                  <span className="clay-secondary font-mono text-xs tabular-nums">
                    {move.before === null ? 'new' : percent(move.before)}
                    {' → '}
                    {percent(move.after)}
                    {rose ? ' up' : ' down'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </ClayPanel>
    </div>
  );
}
