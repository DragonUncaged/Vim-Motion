'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { ClayButton } from '@/components/clay/ClayButton';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { Key } from '@/components/clay/Key';
import { ExercisePlaceholder } from '@/components/ExercisePlaceholder';
import { LiveDuration } from '@/components/LiveDuration';
import { MobileNotice } from '@/components/MobileNotice';
import { RichText } from '@/components/prose/RichText';
import VimEditorLoader from '@/components/editor/VimEditorLoader';
import type { EditorMode, Exercise, Lesson } from '@/content/types';
import { useExercise } from '@/lib/engine';
import type { AttemptState } from '@/lib/engine';
import { useProgress } from '@/lib/progress';
import { duration } from '@/lib/stats/format';
import { useIsWideScreen } from '@/components/hooks/useIsWideScreen';

const MODE_WORDS: Record<EditorMode, string> = {
  normal: 'normal mode',
  insert: 'insert mode',
  visual: 'visual mode',
  'visual-line': 'visual line mode',
  'visual-block': 'visual block mode',
  replace: 'replace mode',
};

export interface LessonLink {
  slug: string;
  title: string;
}

/** A window listener, not an editor keymap: having both navigates twice. */
function useLessonNav(previous: LessonLink | null, next: LessonLink | null, mode: EditorMode) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key !== 'j' && e.key !== 'k') return;
      if (mode === 'insert' || mode === 'replace') return;
      const target = e.key === 'j' ? next : previous;
      if (target === null) return;
      e.preventDefault();
      router.push(`/learn/${target.slug}`);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previous, next, mode, router]);
}

interface StatProps {
  label: string;
  value: ReactNode;
  detail?: string;
}

function Stat({ label, value, detail }: StatProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-xl font-bold">{value}</span>
      <span className="clay-secondary text-xs">{label}</span>
      {/* No opacity: --clay-ink-soft at 80% drops to 3.79:1. */}
      {detail !== undefined && <span className="clay-secondary text-xs">{detail}</span>}
    </div>
  );
}

interface ExercisePaneProps {
  lesson: Lesson;
  exercise: Exercise;
  index: number;
  total: number;
  onModeChange: (mode: EditorMode) => void;
  onSolved: () => void;
  onNext: () => void;
  hasNext: boolean;
  announce: (message: string) => void;
  storageOk: boolean;
}

function ExercisePane({
  lesson,
  exercise,
  index,
  total,
  onModeChange,
  onSolved,
  onNext,
  hasNext,
  announce,
  storageOk,
}: ExercisePaneProps) {
  const [hintShown, setHintShown] = useState(false);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const resultBarRef = useRef<HTMLDivElement | null>(null);

  const handleSolved = useCallback(
    (state: AttemptState) => {
      announce(
        `Solved in ${duration(state.elapsedMs)} and ${state.keystrokes} ` +
          `keystroke${state.keystrokes === 1 ? '' : 's'}. Press r to retry.`,
      );
      onSolved();
    },
    [announce, onSolved],
  );

  const { state, editorProps, reset, failure, nudge, justSolved, focus } = useExercise(exercise, {
    lessonSlug: lesson.slug,
    language: lesson.language,
    onSolved: handleSolved,
    onReleaseFocus: () => resultsRef.current?.focus(),
  });

  const finished = state.status === 'solved' || state.status === 'failed';

  // Move focus off the editor so `r` reaches the page, not vim's replace-char.
  useEffect(() => {
    if (!finished) return;
    const target = expanded ? resultBarRef.current : resultsRef.current;
    target?.focus();
  }, [finished, expanded]);

  useEffect(() => {
    if (!finished) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'r' || e.ctrlKey || e.metaKey || e.altKey) return;
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.closest('.cm-editor')) return;
      e.preventDefault();
      reset();
      focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finished, reset, focus]);

  useEffect(() => setHintShown(false), [exercise.id]);

  /* Null while the attempt runs, or VimEditor's memo re-renders on every keystroke. */
  const resultBar = useMemo(() => {
    if (!finished) return null;
    const solved = state.status === 'solved';
    return (
      <div
        ref={resultBarRef}
        tabIndex={-1}
        className="rounded-[var(--r-card)] outline-none focus-visible:outline-[length:var(--clay-focus-width)] focus-visible:outline-[var(--clay-focus)]"
      >
        <ClayPanel hue={solved ? 'mint' : 'coral'} tint className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <h3 className="m-0 text-base">{solved ? 'Solved' : 'Attempt ended'}</h3>
            <dl className="m-0 flex flex-wrap items-center gap-x-5 gap-y-1">
              {[
                ['time', duration(state.elapsedMs)],
                ['keystrokes', `${state.keystrokes} of ${exercise.par}`],
                ['efficiency', `${Math.round(state.efficiency)}%`],
                ['accuracy', `${Math.round(state.accuracy * 100)}%`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline gap-1.5">
                  <dd className="m-0 font-mono text-sm font-bold tabular-nums">{value}</dd>
                  <dt className="clay-secondary text-xs">{label}</dt>
                </div>
              ))}
            </dl>
            <div className="ml-auto flex flex-wrap gap-2">
              <ClayButton
                intent="secondary"
                onClick={() => {
                  reset();
                  focus();
                }}
              >
                Try it again
              </ClayButton>
              {hasNext && (
                <ClayButton intent="primary" hue="mint" onClick={onNext}>
                  Next exercise
                </ClayButton>
              )}
            </div>
          </div>
          {failure !== null && (
            <RichText as="p" className="clay-prose mt-3 mb-0 text-sm">
              {failure}
            </RichText>
          )}
        </ClayPanel>
      </div>
    );
  }, [
    finished,
    state.status,
    state.elapsedMs,
    state.keystrokes,
    state.efficiency,
    state.accuracy,
    exercise.par,
    failure,
    hasNext,
    onNext,
    reset,
    focus,
  ]);

  return (
    <div className="flex flex-col gap-4">
      <ClayPanel hue="violet" className="px-6 py-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="clay-secondary font-mono text-xs font-bold">
            Exercise {index + 1} of {total}
          </span>
          <span className="clay-secondary text-xs">par {exercise.par} keys</span>
        </div>
        <RichText as="p" className="clay-prose mt-2 mb-0 text-base">
          {exercise.prompt}
        </RichText>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ClayButton
            intent="secondary"
            onClick={() => {
              reset();
              focus();
            }}
          >
            Reset exercise
          </ClayButton>
          {exercise.hint !== undefined && !hintShown && (
            <ClayButton intent="ghost" onClick={() => setHintShown(true)}>
              Show a hint
            </ClayButton>
          )}
        </div>

        {hintShown && exercise.hint !== undefined && (
          <ClayPanel hue="butter" tint size="chip" className="mt-3 px-4 py-3">
            <RichText as="p" className="clay-prose m-0 text-sm">
              {exercise.hint}
            </RichText>
          </ClayPanel>
        )}
      </ClayPanel>

      <VimEditorLoader
        {...editorProps}
        key={exercise.id}
        onModeChange={onModeChange}
        className={justSolved ? 'clay-puff' : ''}
        title={`${lesson.slug}.${lesson.language === 'text' ? 'txt' : lesson.language}`}
        showFocusOverlay={!finished}
        resultBar={resultBar}
        onFullScreenChange={setExpanded}
        allowFullScreen
      />

      {nudge !== null && state.status !== 'solved' && (
        <ClayPanel hue="butter" tint size="chip" className="px-4 py-3">
          <RichText as="p" className="clay-prose m-0 text-sm">
            {nudge}
          </RichText>
        </ClayPanel>
      )}

      <div
        ref={resultsRef}
        tabIndex={-1}
        className="rounded-[var(--r-card)] outline-none focus-visible:outline-[length:var(--clay-focus-width)] focus-visible:outline-[var(--clay-focus)]"
      >
        <ClayPanel
          hue={state.status === 'solved' ? 'mint' : state.status === 'failed' ? 'coral' : 'blue'}
          tint={finished}
          className="px-6 py-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="m-0 text-lg">
              {state.status === 'solved'
                ? 'Solved'
                : state.status === 'failed'
                  ? 'Attempt ended'
                  : state.status === 'running'
                    ? 'In progress'
                    : 'Ready when you are'}
            </h3>
            {finished && (
              <span className="clay-secondary flex items-center gap-1.5 text-xs">
                <Key label="r" size="sm" hue="mint" live={false} />
                retries this exercise
              </span>
            )}
          </div>

          {failure !== null && (
            <RichText as="p" className="clay-prose mt-2 mb-0 text-sm">
              {failure}
            </RichText>
          )}

          {!storageOk && (
            <p className="clay-prose mt-2 mb-0 text-sm" data-testid="storage-notice">
              This browser is not storing attempts, so this one will not count towards your stats.
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="time" value={<LiveDuration attempt={state} />} />
            <Stat
              label="keystrokes"
              value={String(state.keystrokes)}
              detail={`par ${exercise.par}`}
            />
            <Stat label="efficiency" value={`${Math.round(state.efficiency)}%`} />
            <Stat label="accuracy" value={`${Math.round(state.accuracy * 100)}%`} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="clay-secondary text-xs">Trains</span>
            {exercise.motions.map((m) => (
              <span
                key={m}
                className="clay-pill clay-tint hue-violet px-2.5 py-1 font-mono text-xs"
              >
                {m}
              </span>
            ))}
          </div>

          {finished && (
            <div className="mt-5 flex flex-wrap gap-2">
              <ClayButton
                intent="secondary"
                onClick={() => {
                  reset();
                  focus();
                }}
              >
                Try it again
              </ClayButton>
              {hasNext && (
                <ClayButton intent="primary" hue="mint" onClick={onNext}>
                  Next exercise
                </ClayButton>
              )}
            </div>
          )}
        </ClayPanel>
      </div>
    </div>
  );
}

export interface LessonRunnerProps {
  lesson: Lesson;
  module: { id: string; name: string };
  previous: LessonLink | null;
  next: LessonLink | null;
}

export function LessonRunner({ lesson, module: parent, previous, next }: LessonRunnerProps) {
  const slug = lesson.slug;
  const [mode, setMode] = useState<EditorMode>('normal');
  const [current, setCurrent] = useState(0);
  const [solvedHere, setSolvedHere] = useState<Set<string>>(() => new Set());
  const [announcement, setAnnouncement] = useState('');
  const wide = useIsWideScreen();
  const { solvedExercises, storageOk } = useProgress();

  useLessonNav(previous, next, mode);

  const announceTimer = useRef<number | null>(null);
  const announce = useCallback((message: string) => {
    if (announceTimer.current !== null) window.clearTimeout(announceTimer.current);
    announceTimer.current = window.setTimeout(() => setAnnouncement(message), 220);
  }, []);
  useEffect(
    () => () => {
      if (announceTimer.current !== null) window.clearTimeout(announceTimer.current);
    },
    [],
  );

  const handleModeChange = useCallback(
    (nextMode: EditorMode) => {
      setMode(nextMode);
      announce(MODE_WORDS[nextMode]);
    },
    [announce],
  );

  useEffect(() => {
    setCurrent(0);
    setSolvedHere(new Set());
    setMode('normal');
  }, [slug]);

  const exercises = useMemo(() => lesson.exercises, [lesson]);
  const exercise = exercises[current];

  const handleSolved = useCallback(() => {
    if (exercise === undefined) return;
    setSolvedHere((s) => new Set(s).add(exercise.id));
  }, [exercise]);

  const handleNext = useCallback(() => {
    setCurrent((i) => Math.min(i + 1, exercises.length - 1));
  }, [exercises.length]);

  const isSolved = (id: string) => solvedHere.has(id) || solvedExercises.has(`${slug}/${id}`);
  const allSolved = exercises.length > 0 && exercises.every((e) => isSolved(e.id));

  return (
    <article className="flex flex-col gap-8 pt-4">
      <header className="flex flex-col gap-4">
        <p className="clay-secondary m-0 text-sm">
          <Link
            href={`/learn#${parent.id}`}
            className="rounded-[10px] underline decoration-[var(--clay-ink-muted)] underline-offset-4 hover:text-clay-ink"
          >
            {parent.name}
          </Link>
        </p>
        <h1 className="m-0">{lesson.title}</h1>
        <RichText as="p" className="clay-prose m-0 text-lg">
          {lesson.summary}
        </RichText>
        <div className="flex flex-wrap items-center gap-2">
          {lesson.keys.map((k) => (
            <Key key={k} label={k} hue="blue" />
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          {lesson.explanation.map((block) => (
            <ClayPanel key={block.heading} hue="violet" className="px-7 py-6">
              <h2 className="m-0 text-xl">{block.heading}</h2>
              <RichText as="p" className="clay-prose mt-2 mb-0 text-base">
                {block.body}
              </RichText>
            </ClayPanel>
          ))}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {wide === null ? (
            <ExercisePlaceholder className="lg:min-h-[45rem]" />
          ) : wide && exercise !== undefined ? (
            <ExercisePane
              key={exercise.id}
              lesson={lesson}
              exercise={exercise}
              index={current}
              total={exercises.length}
              onModeChange={handleModeChange}
              onSolved={handleSolved}
              onNext={handleNext}
              hasNext={current < exercises.length - 1}
              announce={announce}
              storageOk={storageOk}
            />
          ) : (
            <MobileNotice />
          )}

          {exercises.length > 0 && (
            <ClayPanel hue="blue" className="px-6 py-5">
              <h2 className="m-0 text-lg">
                {exercises.length} exercise{exercises.length === 1 ? '' : 's'} in this lesson
              </h2>
              <p className="clay-secondary mt-1 text-sm">
                Any keys that get you there are correct.
              </p>
              <ol className="mt-4 flex list-none flex-col gap-2 p-0">
                {exercises.map((e, i) => {
                  const done = isSolved(e.id);
                  const active = wide === true && i === current;
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => setCurrent(i)}
                        disabled={wide !== true}
                        aria-current={active ? 'step' : undefined}
                        className={[
                          'clay clay-chip w-full px-4 py-3 text-left',
                          done ? 'hue-mint clay-tint' : 'hue-violet',
                          wide === true ? 'clay-press cursor-pointer' : 'cursor-default',
                          active ? 'ring-2 ring-[var(--clay-focus)]' : '',
                        ].join(' ')}
                      >
                        <span className="flex items-start gap-3">
                          <span className="clay-secondary mt-0.5 font-mono text-xs font-bold">
                            {done ? '✓' : i + 1}
                          </span>
                          <RichText as="span" className="clay-prose text-sm">
                            {e.prompt}
                          </RichText>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </ClayPanel>
          )}

          {allSolved && next !== null && (
            <ClayPanel hue="mint" tint className="px-6 py-5">
              <h2 className="m-0 text-lg">That is the whole lesson</h2>
              <ClayButton asChild intent="primary" hue="mint" className="mt-4">
                <Link href={`/learn/${next.slug}`}>Go to {next.title}</Link>
              </ClayButton>
            </ClayPanel>
          )}
        </div>
      </div>

      <nav aria-label="Lesson" className="flex flex-wrap items-center gap-3">
        {previous !== null && (
          <ClayButton asChild intent="ghost">
            <Link href={`/learn/${previous.slug}`}>Back to {previous.title}</Link>
          </ClayButton>
        )}
        <span className="clay-secondary flex items-center gap-1.5 text-xs">
          <Key label="C-j" size="sm" hue="blue" live={false} />
          <Key label="C-k" size="sm" hue="blue" live={false} />
          move between lessons
        </span>
        {next !== null && (
          <ClayButton asChild intent="primary" className="ml-auto">
            <Link href={`/learn/${next.slug}`}>Next: {next.title}</Link>
          </ClayButton>
        )}
      </nav>

      <div className="clay-sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </article>
  );
}
