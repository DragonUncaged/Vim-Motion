import Link from 'next/link';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { ClayButton } from '@/components/clay/ClayButton';
import { Key } from '@/components/clay/Key';
import { allLessons, lessonsByModule, modules } from '@/content/lessons';
import { allCheats } from '@/content/cheatsheet';
import { HeroEditorMount } from './HeroEditorMount';
import { HeroKeyStrip } from './HeroKeyStrip';

const PILLARS: { keys: string[]; title: string; body: string }[] = [
  {
    keys: ['d', 'w'],
    title: 'A real vim engine',
    body: 'The same vim you would run in a terminal. Nothing is simulated.',
  },
  {
    keys: ['v', 'e', 'x'],
    title: 'Judged on the result',
    body: 'dw, de, vex — if the text ends up right, you are right.',
  },
  {
    keys: ['<C-r>'],
    title: 'Progress stays here',
    body: 'Stored in this browser. Export it, import it elsewhere.',
  },
];

const MODES: {
  href: string;
  keys: string[];
  hue: 'violet' | 'mint' | 'butter';
  title: string;
  body: string;
}[] = [
  {
    href: '/practice',
    keys: ['d', 'a', 'p'],
    hue: 'violet',
    title: 'Drill',
    body: 'Ten exercises, timed, weighted towards whatever is going worst.',
  },
  {
    href: '/sandbox',
    keys: ['c', 'i', '{'],
    hue: 'mint',
    title: 'Sandbox',
    body: 'An open buffer. Press d and the panel lists what can follow it.',
  },
  {
    href: '/practice/speedrun',
    keys: ['.', '.'],
    hue: 'butter',
    title: 'Speedrun',
    body: 'One exercise against the clock, racing your own best time.',
  },
];

export function Landing() {
  const moduleCards = modules.map((m) => {
    const lessons = lessonsByModule[m.id];
    return { ...m, count: lessons.length, keys: lessons.flatMap((l) => l.keys).slice(0, 6) };
  });

  return (
    <div className="flex flex-col gap-10 pt-2">
      <ClayPanel
        hue="violet"
        size="hero"
        // minmax(0, …) and min-w-0: a long line typed in the hero otherwise takes the prose's width.
        className="grid grid-cols-1 items-center gap-8 px-6 py-9 sm:px-10 sm:py-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10"
      >
        <div className="flex min-w-0 flex-col gap-6">
          <h1 className="m-0 max-w-[15ch]">Learn vim motions.</h1>

          <p className="clay-prose m-0 text-lg">
            A real vim editor sits beside this one. Click it, press <Key label="d" size="inline" />{' '}
            <Key label="w" size="inline" />, and watch the word go.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <ClayButton asChild intent="primary">
              <Link href="/learn">Start with modes</Link>
            </ClayButton>
            <ClayButton asChild intent="secondary">
              <Link href="/cheatsheet">Browse the cheatsheet</Link>
            </ClayButton>
          </div>

          <HeroKeyStrip />
        </div>

        <div className="min-w-0">
          <HeroEditorMount />
        </div>
      </ClayPanel>

      <section className="flex flex-col gap-5">
        <h2 className="m-0">What this is</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <ClayPanel key={pillar.title} hue="violet" className="flex flex-col gap-3 px-6 py-6">
              <span className="flex flex-wrap items-center gap-1.5">
                {pillar.keys.map((k, i) => (
                  <Key key={`${pillar.title}-${i}`} label={k} size="sm" hue="violet" />
                ))}
              </span>
              <h3 className="m-0">{pillar.title}</h3>
              <p className="clay-secondary m-0">{pillar.body}</p>
            </ClayPanel>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <h2 className="m-0">The curriculum</h2>
          <p className="clay-prose m-0 text-base">
            {allLessons.length} lessons in {modules.length} modules, from “what is a mode” to
            reshaping real React, Go and C++ files and on to macros and the global command.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {moduleCards.map((m) => (
            <Link
              key={m.id}
              href={`/learn#${m.id}`}
              className={`clay clay-card clay-press hue-${m.accent} flex h-full flex-col gap-3 px-6 py-6 no-underline`}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="clay-display text-[1.3125rem] leading-tight">{m.name}</span>
                {m.count > 0 && (
                  <span className="clay-secondary font-[family-name:var(--font-mono)] whitespace-nowrap">
                    {m.count} lessons
                  </span>
                )}
              </span>
              <span className="clay-secondary">{m.blurb}</span>
              {m.keys.length > 0 && (
                <span className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                  {m.keys.map((k, i) => (
                    <Key key={`${m.id}-${i}`} label={k} size="sm" hue={m.accent} />
                  ))}
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="m-0">Three ways to practise</h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {MODES.map((mode) => (
            <ClayPanel
              key={mode.title}
              hue={mode.hue}
              tint
              className="flex flex-col gap-3 px-6 py-6"
            >
              <span className="flex flex-wrap items-center gap-1.5">
                {mode.keys.map((k, i) => (
                  <Key key={`${mode.title}-${i}`} label={k} size="sm" hue={mode.hue} />
                ))}
              </span>
              <h3 className="m-0">{mode.title}</h3>
              <p className="clay-secondary m-0">{mode.body}</p>
              <Link
                href={mode.href}
                className="clay-btn clay-btn-secondary mt-auto self-start px-4 py-2.5 text-[0.875rem]"
              >
                Open {mode.title.toLowerCase()}
              </Link>
            </ClayPanel>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <ClayPanel hue="blue" className="flex flex-col gap-3 px-6 py-6">
          <span className="flex flex-wrap items-center gap-1.5">
            {['c', 'i', '"'].map((k, i) => (
              <Key key={`sheet-${i}`} label={k} size="sm" hue="blue" />
            ))}
          </span>
          <h3 className="m-0">Cheatsheet</h3>
          <p className="clay-secondary m-0">
            {allCheats.length} motions, searchable by key or by what you are doing. Reads fine on a
            phone.
          </p>
          <Link
            href="/cheatsheet"
            className="clay-btn clay-btn-secondary mt-auto self-start px-4 py-2.5 text-[0.875rem]"
          >
            Open the cheatsheet
          </Link>
        </ClayPanel>

        <ClayPanel hue="mint" className="flex flex-col gap-3 px-6 py-6">
          <span className="flex flex-wrap items-center gap-1.5">
            {['y', 'y', 'p'].map((k, i) => (
              <Key key={`about-${i}`} label={k} size="sm" hue="mint" />
            ))}
          </span>
          <h3 className="m-0">Add your own lessons</h3>
          <p className="clay-secondary m-0">
            A lesson is one TypeScript file. Clone the repo and change the curriculum.
          </p>
          <Link
            href="/about"
            className="clay-btn clay-btn-secondary mt-auto self-start px-4 py-2.5 text-[0.875rem]"
          >
            How to add a lesson
          </Link>
        </ClayPanel>
      </section>
    </div>
  );
}
