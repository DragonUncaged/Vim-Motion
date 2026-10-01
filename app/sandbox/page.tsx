import type { Metadata } from 'next';
import { Sandbox } from '@/components/sandbox/Sandbox';
import { pageMetadata } from '@/lib/seo/copy';

export const metadata: Metadata = pageMetadata({
  title: 'Try vim in your browser, with nothing to solve',
  description:
    'A real vim buffer and a panel that narrows to whatever key can come next. Edit a ' +
    'sample in plain text, TSX, Go or C++, or your own file, which never leaves your browser.',
});

export default function Page() {
  return <Sandbox />;
}
