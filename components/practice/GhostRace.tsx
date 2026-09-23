'use client';

import { useLiveElapsed } from '@/components/LiveDuration';
import { ClayBar } from '@/components/clay/ClayProgress';
import type { ClayHue } from '@/content/types';
import type { AttemptState } from '@/lib/engine';
import type { GhostKey } from '@/lib/progress';
import { duration } from '@/lib/stats/format';
import { GhostReplay } from './GhostReplay';

const OVERRUN = 1.5;

export interface GhostRaceProps {
  attempt: AttemptState;
  bestMs: number | null;
  ghost?: GhostKey[] | null;
  finished: boolean;
  solved: boolean;
}

export function GhostRace({ attempt, bestMs, ghost = null, finished, solved }: GhostRaceProps) {
  const elapsedMs = useLiveElapsed(attempt);

  if (bestMs === null) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-mono text-3xl font-bold tabular-nums">{duration(elapsedMs)}</span>
          <span className="clay-secondary text-sm">no ghost yet</span>
        </div>
        <p className="clay-prose m-0 text-sm">
          Nothing to race yet. Finish it and this run becomes the ghost.
        </p>
      </div>
    );
  }

  const track = bestMs * OVERRUN;
  const yours = Math.min(elapsedMs / track, 1) * 100;
  const ghostValue = Math.min(elapsedMs / track, 1 / OVERRUN) * 100;
  const replaying = ghost !== null && ghost.length > 0;
  const delta = elapsedMs - bestMs;
  const ahead = delta <= 0;

  const hue: ClayHue = finished ? (solved && ahead ? 'mint' : 'coral') : ahead ? 'mint' : 'coral';

  const readout = finished
    ? solved
      ? ahead
        ? `${duration(Math.abs(delta))} faster than your best`
        : `${duration(delta)} slower than your best`
      : 'attempt ended'
    : ahead
      ? `${duration(Math.abs(delta))} of your best left`
      : `${duration(delta)} past your best`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-mono text-3xl font-bold tabular-nums">{duration(elapsedMs)}</span>
        <span className={`text-sm ${ahead ? 'clay-secondary' : 'font-bold'}`}>{readout}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="clay-secondary w-20 shrink-0 text-xs">this run</span>
          <ClayBar value={yours} hue={hue} className="flex-1" label="your time so far" />
        </div>
        <div className="flex items-center gap-3">
          <span className="clay-secondary w-20 shrink-0 text-xs">your ghost</span>
          <ClayBar
            value={ghostValue}
            hue="violet"
            className="h-[0.45rem]! flex-1"
            label={
              replaying
                ? `your previous best, ${duration(bestMs)} in ${ghost.length} keys`
                : `your previous best, ${duration(bestMs)}`
            }
          />
        </div>
        {replaying && <GhostReplay timeline={ghost} attempt={attempt} hue="violet" />}
      </div>

      {replaying && (
        <p className="clay-secondary m-0 text-xs">
          {`The keys that set your best, ${duration(bestMs)}, at the speed you pressed them.`}
        </p>
      )}
    </div>
  );
}
