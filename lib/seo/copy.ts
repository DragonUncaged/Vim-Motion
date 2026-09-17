import type { Metadata } from 'next';
import { plainProse } from '@/lib/prose/richtext-parse';
import { normalizeKeyName } from '@/lib/keyboard';
import type { DrillCategory, DrillItem } from '@/lib/drills';
import { SITE_URL } from '@/lib/site';
import type { LessonCard } from '@/content/types';

export const SITE_NAME = 'Vim Clay';

/** Open Graph does not go through the layout's title template, so og:title spells the suffix out. */
export const TITLE_SUFFIX = ` — ${SITE_NAME}`;

export const SITE_DESCRIPTION =
  'Learn vim motions in a real vim editor, in your browser: modes, the operator grammar, ' +
  'text objects, registers and macros.';

/** Attached only once lib/site.ts has an origin: a relative og:image is a dead image on every platform. */
export const OG_IMAGE_PATH = '/og.png';

const ogImages =
  SITE_URL === ''
    ? {}
    : {
        images: [
          {
            url: OG_IMAGE_PATH,
            width: 1200,
            height: 630,
            alt: 'Vim Clay — a clay keycap with a vim block cursor on it',
          },
        ],
      };

export interface PageCopy {
  /** The layout's template adds the suffix; do not write it here. */
  title: string;
  description: string;
  shareTitle?: string;
  noindex?: boolean;
}

/** Metadata merges shallowly: a partial openGraph would drop og:site_name, og:type and the image. */
export function pageMetadata({
  title,
  description,
  shareTitle = `${title}${TITLE_SUFFIX}`,
  noindex = false,
}: PageCopy): Metadata {
  return {
    title,
    description,
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      // Not derived from the canonical: checked on Next 15.5, og:url needs setting.
      ...(SITE_URL === '' ? {} : { url: './' }),
      title: shareTitle,
      description,
      ...ogImages,
    },
    twitter: { card: 'summary_large_image', title: shareTitle, description },
  };
}

export function siteMetadata(): Metadata {
  const siteTitle = `${SITE_NAME} — learn vim motions`;
  const { title: _segmentTitle, ...share } = pageMetadata({
    title: siteTitle,
    description: SITE_DESCRIPTION,
    shareTitle: siteTitle,
  });
  return {
    ...(SITE_URL === ''
      ? {}
      : { metadataBase: new URL(SITE_URL), alternates: { canonical: './' } }),
    ...share,
    title: { default: siteTitle, template: `%s${TITLE_SUFFIX}` },
  };
}

/** Angle brackets are content notation (docs/CONTRACT.md §4 rule 4b), not something a reader types. */
export function spokenKey(written: string): string {
  const key = normalizeKeyName(written);
  const ctrl = /^C-(.+)$/.exec(key);
  if (ctrl) return `Ctrl-${ctrl[1]}`;
  const alt = /^M-(.+)$/.exec(key);
  if (alt) return `Alt-${alt[1]}`;
  return key;
}

function andList(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

export const DESCRIPTION_MAX = 160;

const KEYS_IN_TITLE = 4;

export const LESSON_INTENT: Record<string, string> = {
  modes: 'Vim modes, and how to get out of insert mode',
  hjkl: 'Move the cursor in vim with h, j, k and l',
  'small-edits': 'Fix a typo in vim without insert mode',
  'big-words': 'WORD motions in vim: W, E and B',
  'line-ends': 'Jump to the start or end of a line in vim',
  operators: 'The vim operator grammar: a verb plus a motion',
  delete: 'Delete a word or a line in vim: dw, dd and D',
  jumps: 'Jump to a line in vim: gg, G and a count',
  search: 'Search a file in vim with /, n and *',
  'text-objects': 'Vim text objects: change inside quotes or braces',
  macros: 'Record and replay a macro in vim: q, @ and @@',
  'go-errs': 'Delete an if err != nil block in vim',
  'tsx-refactor': 'Rename a prop across a file in vim with * and .',
};

export function lessonTitle(lesson: LessonCard): string {
  const intent = LESSON_INTENT[lesson.slug];
  if (intent !== undefined) return intent;
  const keys = lesson.keys.slice(0, KEYS_IN_TITLE).map(spokenKey);
  const named = keys.length === 0 ? '' : `: ${andList(keys)}`;
  return `${lesson.title} in vim${named}`;
}

export function lessonDescription(lesson: LessonCard): string {
  const n = lesson.exercises.length;
  const count = `${n} exercise${n === 1 ? '' : 's'}`;
  const summary = plainProse(lesson.summary);
  const tails = [
    `${count} in a real vim editor, judged on the result, not on the keys you typed.`,
    `${count} in a real vim editor, judged on the result.`,
    `${count} in a real vim editor.`,
  ];
  const tail = tails.find((t) => summary.length + 1 + t.length <= DESCRIPTION_MAX);
  return `${summary} ${tail ?? tails[tails.length - 1]}`;
}

export function lessonCopy(lesson: LessonCard): PageCopy {
  return { title: lessonTitle(lesson), description: lessonDescription(lesson) };
}

export function drillTitle(category: DrillCategory): string {
  if (category.kind === 'weakest') return 'Drill your weakest vim motions';
  if (category.kind === 'group') return `Vim ${category.name.toLowerCase()} drill`;
  return `Vim drill: ${category.name}`;
}

export function drillCopy(category: DrillCategory): PageCopy {
  return {
    title: drillTitle(category),
    description: `${category.blurb} Ten exercises, timed and scored on keystrokes as well as the clock.`,
  };
}

export const SPEEDRUN_COPY: PageCopy = {
  title: 'Vim speedrun: one exercise against the clock',
  description:
    'One exercise, one timer, and your own best run as the ghost to beat. Times are kept in ' +
    'this browser.',
};

export function speedrunItemCopy(item: DrillItem): PageCopy {
  return {
    title: `Vim speedrun: ${item.lessonTitle}`,
    description:
      `A single timed run at one exercise from the ${item.lessonTitle} lesson, ` +
      'raced against your own personal best.',
    noindex: true,
  };
}
