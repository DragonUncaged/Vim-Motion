import type { Metadata } from 'next';
import { StatsPage } from '@/components/stats/StatsPage';
import { catalogue, catalogueByModule, modules } from '@/content/lessons';
import { pageMetadata } from '@/lib/seo/copy';

export const metadata: Metadata = pageMetadata({
  title: 'Your vim progress, motion by motion',
  description:
    'Speed, accuracy and a mastery score for every motion you have practised, computed in ' +
    'this browser from your own attempts. Export it to move it to another device.',
});

export default function Page() {
  return <StatsPage modules={modules} lessons={catalogue} lessonsByModule={catalogueByModule} />;
}
