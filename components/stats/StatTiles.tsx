import { ClayPanel } from '@/components/clay/ClayPanel';
import type { ClayHue } from '@/components/clay/Key';
import {
  NO_VALUE,
  count,
  duration,
  fraction,
  longDuration,
  percent,
  plural,
  rate,
} from '@/lib/stats/format';
import type { StatsSummary } from '@/lib/stats';

interface Tile {
  label: string;
  value: string;
  caption: string;
  hue: ClayHue;
}

export function StatTiles({ summary }: { summary: StatsSummary }) {
  const tiles: Tile[] = [
    {
      label: 'Exercises solved',
      value: count(summary.exercisesSolved),
      caption:
        summary.lessonsTouched === 0
          ? 'Counted once each, however many tries it took'
          : `Across ${plural(summary.lessonsTouched, 'lesson')}`,
      hue: 'blue',
    },
    {
      label: 'Current streak',
      value: count(summary.streak.current),
      caption: 'Solves in a row inside twice par',
      hue: 'butter',
    },
    {
      label: 'Best streak',
      value: count(summary.streak.best),
      caption: 'The longest run you have had',
      hue: 'butter',
    },
    {
      label: 'Median solve',
      value: duration(summary.medianSolveMs),
      caption: 'Half your solves are faster than this',
      hue: 'violet',
    },
    {
      label: 'Average efficiency',
      value: percent(summary.avgEfficiency),
      caption: 'Par keys over the keys you spent',
      hue: 'violet',
    },
    {
      label: 'Average accuracy',
      value: fraction(summary.avgAccuracy),
      caption: 'Keys that actually changed something',
      hue: 'mint',
    },
    {
      label: 'Keys per minute',
      value: rate(summary.kpm),
      caption: 'Your pace while an exercise is running',
      hue: 'blue',
    },
    {
      label: 'Time practised',
      value: summary.totalTimeMs === 0 ? NO_VALUE : longDuration(summary.totalTimeMs),
      caption: 'Time inside exercises, not time on the site',
      hue: 'mint',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {tiles.map((tile) => (
        <ClayPanel
          key={tile.label}
          hue={tile.hue}
          size="chip"
          className="flex min-w-0 flex-col gap-1 px-5 py-4"
        >
          <span className="clay-secondary text-[0.8125rem] leading-tight">{tile.label}</span>
          <span className="font-display text-[1.75rem] leading-none font-semibold break-words">
            {tile.value}
          </span>
          <span className="clay-secondary text-[0.75rem] leading-snug">{tile.caption}</span>
        </ClayPanel>
      ))}
    </div>
  );
}
