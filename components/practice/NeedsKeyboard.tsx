'use client';

import Link from 'next/link';
import { ClayButton } from '@/components/clay/ClayButton';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { KeyRun } from '@/components/clay/Key';
import { MobileNotice } from '@/components/MobileNotice';
import { motionKeys } from '@/lib/stats';
import { plural } from '@/lib/stats/format';
import { displayMotion } from '@/lib/drills';

export function NeedsKeyboard({
  title,
  motions,
  lessonSlug,
}: {
  title: string;
  motions: string[];
  lessonSlug?: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <MobileNotice />

      <ClayPanel hue="violet" className="flex flex-col gap-4 px-6 py-5">
        <div className="flex flex-col gap-2">
          <h2 className="m-0 text-lg">{title}</h2>
          <p className="clay-prose m-0 text-sm">
            {plural(motions.length, 'motion')} in this run. The cheatsheet has them all.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {motions.slice(0, 18).map((motion) => (
            <KeyRun key={motion} keys={motionKeys(displayMotion(motion))} size="sm" live={false} />
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <ClayButton asChild intent="secondary">
            <Link href="/cheatsheet">Open the cheatsheet</Link>
          </ClayButton>
          <ClayButton asChild intent="ghost">
            <Link href={lessonSlug === undefined ? '/learn' : `/learn/${lessonSlug}`}>
              {lessonSlug === undefined ? 'Read the lessons' : 'Read this lesson'}
            </Link>
          </ClayButton>
        </div>
      </ClayPanel>
    </div>
  );
}
