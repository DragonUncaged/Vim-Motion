import type { Metadata } from 'next';
import { About } from '@/components/about/About';
import { pageMetadata } from '@/lib/seo/copy';

export const metadata: Metadata = pageMetadata({
  title: 'How to add a lesson',
  description:
    'Where your progress is kept and how to carry it between machines, and the three ' +
    'steps to contribute a lesson to the curriculum.',
});

export default function Page() {
  return <About />;
}
