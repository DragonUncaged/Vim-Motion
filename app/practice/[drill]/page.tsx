import type { Metadata } from 'next';
import { DrillRun } from '@/components/practice/DrillRun';
import {
  categories,
  categoryById,
  itemByKey,
  parseDrillSegment,
  SPEEDRUN_PREFIX,
} from '@/lib/drills';
import { drillPool } from '@/lib/drills/pool';
import { drillCopy, pageMetadata, SPEEDRUN_COPY, speedrunItemCopy } from '@/lib/seo/copy';

interface Params {
  params: Promise<{ drill: string }>;
}

export function generateStaticParams() {
  return [
    ...categories.map((category) => ({ drill: category.id })),
    { drill: SPEEDRUN_PREFIX },
    ...drillPool.map((item) => ({
      drill: `${SPEEDRUN_PREFIX}.${item.lessonSlug}.${item.exerciseId}`,
    })),
  ];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { drill } = await params;
  const route = parseDrillSegment(drill);
  if (route.mode === 'speedrun') {
    const item = route.itemKey === null ? undefined : itemByKey(drillPool, route.itemKey);
    return pageMetadata(item === undefined ? SPEEDRUN_COPY : speedrunItemCopy(item));
  }
  const category = categoryById(route.categoryId);
  if (category === undefined) return { title: 'Drill not found' };
  return pageMetadata(drillCopy(category));
}

export default async function Page({ params }: Params) {
  const { drill } = await params;
  return <DrillRun drill={drill} pool={drillPool} />;
}
