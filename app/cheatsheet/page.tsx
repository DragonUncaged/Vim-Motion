import type { Metadata } from 'next';
import { Cheatsheet } from '@/components/cheatsheet/Cheatsheet';
import { pageMetadata } from '@/lib/seo/copy';

export const metadata: Metadata = pageMetadata({
  title: 'Vim cheat sheet: every motion, on one page',
  description:
    'Motions, operators, text objects, visual mode, counts, registers and macros — ' +
    'searchable, with the keys drawn as keycaps and a link to the lesson that teaches each.',
});

export default function Page() {
  return <Cheatsheet />;
}
