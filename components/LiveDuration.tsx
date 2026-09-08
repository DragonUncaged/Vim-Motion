'use client';

import { useEffect, useState } from 'react';
import type { AttemptState } from '@/lib/engine';
import { duration } from '@/lib/stats/format';

const TICK_MS = 100;

/** Re-renders every tick, so call it in a leaf. */
export function useLiveElapsed(attempt: AttemptState): number {
  const { runningSince, accumulatedMs } = attempt;
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (runningSince === null) {
      setNow(null);
      return;
    }
    setNow(performance.now());
    const id = window.setInterval(() => setNow(performance.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, [runningSince]);

  if (runningSince === null || now === null) return accumulatedMs;
  return Math.max(0, now - runningSince);
}

export function LiveDuration({ attempt }: { attempt: AttemptState }) {
  // e2e/editor-focus-clock.spec.ts reads the clock through this testid.
  return (
    <span className="tabular-nums" data-testid="attempt-time">
      {duration(useLiveElapsed(attempt))}
    </span>
  );
}
