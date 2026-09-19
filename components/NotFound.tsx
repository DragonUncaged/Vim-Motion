import Link from 'next/link';

import { ClayButton } from '@/components/clay/ClayButton';
import { ClayPanel } from '@/components/clay/ClayPanel';

/** No "press one" keycaps: they were live={false}, so the invitation could not be kept. */
export function NotFound() {
  return (
    <div className="flex flex-col gap-6 pt-4">
      <header className="flex flex-col gap-3">
        <p className="clay-secondary m-0 text-sm">404</p>
        <h1 className="m-0">Nothing at this address</h1>
      </header>

      <ClayPanel hue="coral" className="flex flex-col gap-4 px-7 py-6">
        <p className="clay-prose m-0 text-base">The link is wrong or the page has moved.</p>
        <div className="flex flex-wrap items-center gap-3">
          <ClayButton asChild intent="primary">
            <Link href="/learn">Go to the lessons</Link>
          </ClayButton>
          <ClayButton asChild intent="secondary">
            <Link href="/cheatsheet">Browse the cheatsheet</Link>
          </ClayButton>
          <ClayButton asChild intent="ghost">
            <Link href="/">Back to the start</Link>
          </ClayButton>
        </div>
      </ClayPanel>
    </div>
  );
}
