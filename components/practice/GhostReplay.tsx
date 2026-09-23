'use client';

/** A recording, never a second editor: vim registers are module-global and would clobber the attempt's. */

import { useEffect, useState } from 'react';

import { Key } from '@/components/clay/Key';
import type { ClayHue } from '@/content/types';
import { keysPlayed } from '@/lib/drills';
import type { AttemptState } from '@/lib/engine';
import type { GhostKey } from '@/lib/progress';

const WINDOW = 8;

export interface GhostReplayProps {
  timeline: GhostKey[];
  /** Plays against runningSince: wall-clock time or 0 starts the ghost before the learner. */
  attempt: AttemptState;
  hue: ClayHue;
}

export function GhostReplay({ timeline, attempt, hue }: GhostReplayProps) {
  const { runningSince, accumulatedMs, status } = attempt;
  const [played, setPlayed] = useState(0);

  useEffect(() => {
    if (runningSince === null) {
      setPlayed(status === 'idle' ? 0 : keysPlayed(timeline, accumulatedMs));
      return;
    }
    let frame = 0;
    const step = () => {
      setPlayed(keysPlayed(timeline, performance.now() - runningSince));
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [timeline, runningSince, accumulatedMs, status]);

  const caps = timeline.slice(Math.max(0, played - WINDOW), played);
  const done = played >= timeline.length;
  const waiting = status === 'idle';

  return (
    <div className="flex items-center gap-3">
      <span className="clay-secondary w-20 shrink-0 text-xs">
        {waiting ? 'your ghost' : done ? 'ghost done' : 'ghost keys'}
      </span>
      <div
        className="flex min-h-[1.75rem] min-w-0 flex-wrap items-center gap-1"
        aria-hidden="true"
        data-testid="ghost-keys"
      >
        {caps.length === 0 ? (
          <span className="clay-secondary text-xs">
            {waiting ? 'starts when you press your first key' : 'about to move'}
          </span>
        ) : (
          caps.map((entry, i) => (
            <Key
              key={played - caps.length + i}
              label={entry.key}
              size="sm"
              hue={hue}
              live={false}
              pressed={i === caps.length - 1 && !done}
              className={i === caps.length - 1 && !done ? '' : 'opacity-70'}
            />
          ))
        )}
      </div>
      <span
        className="clay-secondary ml-auto shrink-0 font-mono text-xs tabular-nums"
        data-testid="ghost-key-count"
      >
        {played} of {timeline.length}
      </span>
    </div>
  );
}
