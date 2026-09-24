'use client';

/** docs/CONTRACT.md §8: the route stays thin, so drill and speedrun share this segment. */

import Link from 'next/link';
import { ClayButton } from '@/components/clay/ClayButton';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { categoryById, parseDrillSegment } from '@/lib/drills';
import type { DrillItem } from '@/lib/drills';
import { DrillSession } from './DrillSession';
import { Speedrun } from './Speedrun';

export function DrillRun({ drill, pool }: { drill: string; pool: DrillItem[] }) {
  const route = parseDrillSegment(drill);

  if (route.mode === 'speedrun') return <Speedrun itemKey={route.itemKey} pool={pool} />;

  const category = categoryById(route.categoryId);
  if (category === undefined) {
    return (
      <div className="flex flex-col gap-6 pt-4">
        <h1 className="m-0">No drill by that name</h1>
        <ClayPanel hue="coral" className="px-7 py-6">
          <p className="clay-prose m-0 text-base">
            <code className="clay-code">{drill}</code> is not one of the categories — the link is
            wrong.
          </p>
          <ClayButton asChild intent="primary" className="mt-4">
            <Link href="/practice">See every drill</Link>
          </ClayButton>
        </ClayPanel>
      </div>
    );
  }

  return <DrillSession category={category} pool={pool} />;
}
