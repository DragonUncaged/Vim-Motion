import type { Metadata } from 'next';
import { DrillPicker } from '@/components/practice/DrillPicker';
import { drillPool } from '@/lib/drills/pool';
import { pageMetadata } from '@/lib/seo/copy';

export const metadata: Metadata = pageMetadata({
  title: 'Practise vim motions with timed drills',
  description:
    'Fifteen drill categories and a speedrun, weighted toward the motions you are slowest ' +
    'at. Ten exercises a run, scored on keystrokes as well as the clock.',
});

export default function Page() {
  return <DrillPicker pool={drillPool} />;
}
