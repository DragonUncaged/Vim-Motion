'use client';

import { KeyRun } from '@/components/clay/Key';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { MASTERED_AT, motionKeys } from '@/lib/stats';
import { percent } from '@/lib/stats/format';
import type { ClayHue } from '@/components/clay/Key';
import { displayMotion, type MotionStanding } from '@/lib/drills';

export function masteryHue(mastery: number | undefined): ClayHue {
  if (mastery === undefined) return 'blue';
  if (mastery < 50) return 'coral';
  if (mastery < MASTERED_AT) return 'butter';
  return 'mint';
}

function standingLabel(mastery: number | undefined): string {
  if (mastery === undefined) return 'new to you';
  return percent(mastery);
}

export function MotionChip({ standing }: { standing: MotionStanding }) {
  const hue = masteryHue(standing.mastery);
  return (
    <span
      className={`clay clay-chip clay-tint hue-${hue} flex items-center gap-2 px-3 py-1.5`}
      title={
        standing.mastery === undefined
          ? `${standing.motion} — you have not practised this yet`
          : `${standing.motion} — mastery ${percent(standing.mastery)}`
      }
    >
      <KeyRun keys={motionKeys(displayMotion(standing.motion))} size="sm" live={false} hue={hue} />
      <span className="clay-secondary text-xs">{standingLabel(standing.mastery)}</span>
    </span>
  );
}

export interface TargetedMotionsProps {
  standings: MotionStanding[];
  cold: boolean;
  limit?: number;
  className?: string;
}

export function TargetedMotions({
  standings,
  cold,
  limit = 12,
  className = '',
}: TargetedMotionsProps) {
  const shown = standings.slice(0, limit);
  const rest = standings.length - shown.length;

  return (
    <ClayPanel hue="coral" tint className={`flex flex-col gap-3 px-6 py-5 ${className}`.trim()}>
      <h2 className="m-0 text-lg">{cold ? 'What this run covers' : 'Your weakest, first'}</h2>
      <p className="clay-prose m-0 text-sm">
        {cold
          ? 'Nothing ranked yet, so this run spreads evenly across the curriculum.'
          : 'Weakest first — what you avoid is what you get.'}
      </p>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {shown.map((standing) => (
          <li key={standing.motion}>
            <MotionChip standing={standing} />
          </li>
        ))}
        {rest > 0 && <li className="clay-secondary self-center text-xs">and {rest} more</li>}
      </ul>
    </ClayPanel>
  );
}
