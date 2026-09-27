import Link from 'next/link';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { ClayButton } from '@/components/clay/ClayButton';
import { ClayBar } from '@/components/clay/ClayProgress';
import { KeyRun } from '@/components/clay/Key';
import { motionKeys, type MotionMastery } from '@/lib/stats';
import { percent, plural } from '@/lib/stats/format';
import type { LessonCard } from '@/content/types';

export function WeakestMotions({
  weakest,
  lessonForMotion,
}: {
  weakest: MotionMastery[];
  lessonForMotion: (motion: string) => LessonCard | undefined;
}) {
  if (weakest.length === 0) {
    return (
      <ClayPanel hue="coral" className="flex flex-col gap-3 px-7 py-6">
        <h2 className="m-0 text-xl">Your weakest motions</h2>
        <p className="clay-prose m-0 text-base">
          Nothing to rank yet. Solve a few and the five costliest motions appear here.
        </p>
      </ClayPanel>
    );
  }

  return (
    <ClayPanel hue="coral" tint className="flex flex-col gap-5 px-7 py-6">
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-xl">Your weakest motions</h2>
        <p className="clay-prose m-0 text-base">
          The {weakest.length === 1 ? 'motion' : `${weakest.length} motions`} costing you the most
          keys, worst first.
        </p>
      </div>

      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {weakest.map((entry) => {
          const lesson = lessonForMotion(entry.motion);
          return (
            <li
              key={entry.motion}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-chip bg-clay-surface/70 px-4 py-3"
            >
              <span className="min-w-[5rem]">
                <KeyRun keys={motionKeys(entry.motion)} size="sm" live={false} />
              </span>
              <span className="min-w-[9rem] flex-1">
                <ClayBar
                  value={entry.mastery}
                  hue={entry.mastery < 50 ? 'coral' : entry.mastery < 70 ? 'butter' : 'mint'}
                  label={`${entry.motion} mastery`}
                />
              </span>
              <span className="clay-secondary text-sm">
                {percent(entry.mastery)} · {plural(entry.attempts, 'attempt')}
              </span>
              {lesson !== undefined && (
                <Link
                  href={`/learn/${lesson.slug}`}
                  className="clay-focusable rounded-chip text-sm underline underline-offset-4"
                >
                  {lesson.title}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-4">
        <ClayButton intent="primary" asChild>
          <Link href="/practice/weakest">Practise these motions</Link>
        </ClayButton>
        <span className="clay-secondary text-sm">Ten exercises, weighted towards these.</span>
      </div>
    </ClayPanel>
  );
}
