import Link from 'next/link';
import { Key } from '@/components/clay/Key';
import { RichText } from '@/components/prose/RichText';
import { splitKeyGroup } from '@/lib/prose/richtext-parse';
import type { CheatAccent, CheatEntry } from '@/content/cheatsheet';
import { lessonForMotion, type MotionLessonIndex } from './lessonLinks';
import { MASTERED_AT } from './mastery';

export interface CheatRowProps {
  entry: CheatEntry;
  accent: CheatAccent;
  lessons: MotionLessonIndex;
  mastery?: number;
  active?: boolean;
  index?: number;
}

/** Caps stay live={false}: at 1440x900 a keydown pressed 25 caps and none were in the first viewport. */
export function CheatRow({
  entry,
  accent,
  lessons,
  mastery,
  active = false,
  index,
}: CheatRowProps) {
  const caps = splitKeyGroup(entry.keys);
  const lesson = lessonForMotion(lessons, entry.motion);
  const mastered = mastery !== undefined && mastery >= MASTERED_AT;

  return (
    <li
      id={`cheat-${entry.id}`}
      data-index={index}
      aria-current={active ? 'true' : undefined}
      className={[
        // minmax(0, 1fr), not 1fr: an unbroken token otherwise scrolls the page sideways at 375px.
        'grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 rounded-[18px] px-2 py-2 sm:px-3',
        'sm:grid-cols-[minmax(6rem,auto)_minmax(0,1fr)_auto] sm:items-baseline sm:gap-x-4',
        active
          ? 'bg-[var(--clay-sunken)] outline-2 outline-offset-2 outline-[var(--clay-focus)]'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="col-start-1 row-start-1 flex flex-wrap items-center gap-[0.2rem] self-start sm:self-center">
        {caps.map((cap, i) => (
          <Key
            key={`${entry.id}-${i}`}
            label={cap}
            size="sm"
            hue={mastered ? 'mint' : accent}
            mastered={mastered}
            live={false}
          />
        ))}
      </span>

      <span className="col-start-2 row-start-1 flex min-w-0 flex-col gap-1 self-center">
        <RichText as="span" className="text-[0.9375rem] leading-relaxed break-words text-clay-ink">
          {entry.desc}
        </RichText>
        {entry.note !== undefined && (
          <RichText as="span" className="clay-secondary">
            {entry.note}
          </RichText>
        )}
      </span>

      <span className="col-start-2 row-start-2 flex flex-wrap items-center gap-2 self-center sm:col-start-3 sm:row-start-1 sm:justify-end">
        {mastery !== undefined && (
          <span
            className="clay-well hue-mint px-2 py-0.5 font-[family-name:var(--font-mono)] text-[0.6875rem] font-bold text-clay-ink"
            title={`Mastery ${mastery} out of 100, over your last attempts at this motion`}
          >
            {mastery}
          </span>
        )}
        {lesson !== undefined && (
          <Link
            href={`/learn/${lesson.slug}`}
            className="rounded-[10px] text-[0.8125rem] whitespace-nowrap text-[var(--clay-ink-soft)] underline decoration-[var(--clay-ink-muted)] underline-offset-4 hover:text-clay-ink"
          >
            Lesson: {lesson.title}
          </Link>
        )}
      </span>
    </li>
  );
}
