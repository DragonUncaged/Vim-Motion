'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { ClayButton } from '@/components/clay/ClayButton';
import { Key } from '@/components/clay/Key';
import { useProgress } from '@/lib/progress';
import { cheatGroups, cheatTasks, type CheatAccent, type CheatEntry } from '@/content/cheatsheet';
import { CheatRow } from './CheatRow';
import { lessonForMotion, type MotionLessonIndex } from './lessonLinks';
import { masteryByMotion, motionFamily } from './mastery';
import { searchCheats } from './search';

type View = 'operator' | 'task';

interface Section {
  id: string;
  title: string;
  blurb: string;
  accent: CheatAccent;
  entries: CheatEntry[];
}

const OPERATOR_SECTIONS: Section[] = cheatGroups.map((group) => ({
  id: `group-${group.id}`,
  title: group.title,
  blurb: group.blurb,
  accent: group.accent,
  entries: group.entries,
}));

const TASK_SECTIONS: Section[] = cheatTasks.map((task) => ({
  id: `task-${task.id}`,
  title: task.title,
  blurb: task.blurb,
  accent: task.accent,
  entries: cheatGroups.flatMap((g) => g.entries.filter((e) => e.tasks?.includes(task.id))),
}));

const ACCENT_BY_GROUP = new Map<string, CheatAccent>(cheatGroups.map((g) => [g.id, g.accent]));

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export interface CheatsheetBrowserProps {
  lessons: MotionLessonIndex;
}

export function CheatsheetBrowser({ lessons }: CheatsheetBrowserProps) {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View>('operator');
  const [active, setActive] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const router = useRouter();

  const { attempts, hydrated } = useProgress();

  const mastery = useMemo(
    () => (hydrated ? masteryByMotion(attempts) : new Map<string, number>()),
    [attempts, hydrated],
  );

  const masteryFor = useCallback(
    (entry: CheatEntry): number | undefined =>
      entry.motion === undefined ? undefined : mastery.get(motionFamily(entry.motion)),
    [mastery],
  );

  const results = useMemo(() => searchCheats(query), [query]);
  const searching = query.trim() !== '';
  const sections = view === 'operator' ? OPERATOR_SECTIONS : TASK_SECTIONS;

  const sectionOffsets = useMemo(() => {
    const offsets: number[] = [];
    let at = 0;
    for (const section of sections) {
      offsets.push(at);
      at += section.entries.length;
    }
    return offsets;
  }, [sections]);

  const flat: CheatEntry[] = useMemo(
    () => (searching ? results.map((m) => m.item.entry) : sections.flatMap((s) => s.entries)),
    [searching, results, sections],
  );

  useEffect(() => {
    setActive(searching && results.length > 0 ? 0 : -1);
  }, [query, searching, results.length]);

  useEffect(() => {
    if (active < 0 || listRef.current === null) return;
    listRef.current.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const move = (delta: number): void => {
    if (flat.length === 0) return;
    setActive((current) => {
      if (current < 0) return delta > 0 ? 0 : flat.length - 1;
      return Math.max(0, Math.min(flat.length - 1, current + delta));
    });
  };

  const onInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>): void => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        move(-1);
        break;
      case 'Enter': {
        const entry = flat[active];
        const lesson = entry === undefined ? undefined : lessonForMotion(lessons, entry.motion);
        if (lesson !== undefined) {
          event.preventDefault();
          router.push(`/learn/${lesson.slug}`);
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        if (query === '') inputRef.current?.blur();
        else setQuery('');
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <ClayPanel hue="violet" className="flex flex-col gap-4 px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* The focus ring is on the well, not the input (docs/CONTRACT.md §7). */}
          <div className="clay-well flex flex-1 items-center gap-3 px-4 py-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--clay-focus)]">
            <label htmlFor="cheat-search" className="clay-sr-only">
              Search the cheatsheet by key or by what you want to do
            </label>
            <Key label="/" size="sm" hue="violet" live={false} />
            <input
              id="cheat-search"
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search keys or words — ci, quotes, delete a line"
              autoComplete="off"
              spellCheck={false}
              aria-controls={listId}
              aria-describedby="cheat-search-help"
              className="w-full min-w-0 bg-transparent font-[family-name:var(--font-mono)] text-[0.9375rem] text-clay-ink outline-none placeholder:text-[var(--clay-ink-muted)]"
            />
            {searching && (
              <ClayButton
                intent="ghost"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="px-3 py-1.5 text-[0.8125rem]"
              >
                Clear
              </ClayButton>
            )}
          </div>

          {!searching && (
            <div
              className="flex items-center gap-2"
              role="group"
              aria-label="Group the reference by"
            >
              <ClayButton
                intent={view === 'operator' ? 'primary' : 'secondary'}
                aria-pressed={view === 'operator'}
                onClick={() => setView('operator')}
                className="px-4 py-2.5 text-[0.875rem]"
              >
                By operator
              </ClayButton>
              <ClayButton
                intent={view === 'task' ? 'primary' : 'secondary'}
                aria-pressed={view === 'task'}
                onClick={() => setView('task')}
                className="px-4 py-2.5 text-[0.875rem]"
              >
                By task
              </ClayButton>
            </div>
          )}
        </div>

        <p
          id="cheat-search-help"
          className="clay-secondary m-0 flex flex-wrap items-center gap-x-2 gap-y-1"
        >
          <Key label="/" size="sm" hue="violet" live={false} />
          <span>focuses,</span>
          <Key label="Up" size="sm" hue="violet" live={false} />
          <Key label="Down" size="sm" hue="violet" live={false} />
          <span>move,</span>
          <Key label="CR" size="sm" hue="violet" live={false} />
          <span>opens the lesson,</span>
          <Key label="Esc" size="sm" hue="violet" live={false} />
          <span>clears.</span>
        </p>

        <p aria-live="polite" className="clay-sr-only">
          {searching ? `${results.length} matches for ${query}` : ''}
        </p>
      </ClayPanel>

      <div ref={listRef} id={listId} className="flex flex-col gap-6">
        {searching && results.length === 0 && (
          <ClayPanel hue="coral" tint className="px-6 py-6">
            <h2 className="m-0 text-xl">Nothing matches that</h2>
            <p className="clay-prose mt-2 text-base">
              Try a key — <code className="clay-code">ci</code>,{' '}
              <code className="clay-code">dap</code>, <code className="clay-code">C-d</code> — or a
              word: quotes, paragraph, undo.
            </p>
          </ClayPanel>
        )}

        {searching && results.length > 0 && (
          <ClayPanel hue="violet" className="px-3 py-5 sm:px-5">
            <h2 className="mx-2 mt-0 mb-4 text-[1.375rem]">
              {results.length} {results.length === 1 ? 'match' : 'matches'}
            </h2>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {results.map((match, i) => (
                <CheatRow
                  key={match.item.entry.id}
                  entry={match.item.entry}
                  accent={ACCENT_BY_GROUP.get(match.item.groupId) ?? 'violet'}
                  lessons={lessons}
                  mastery={masteryFor(match.item.entry)}
                  active={i === active}
                  index={i}
                />
              ))}
            </ul>
          </ClayPanel>
        )}

        {!searching &&
          sections.map((section, sectionIndex) => (
            <ClayPanel key={section.id} hue={section.accent} className="px-3 py-5 sm:px-5">
              <header className="mx-2 mb-4 flex flex-col gap-1.5">
                <h2 className="m-0 text-[1.375rem]">{section.title}</h2>
                <p className="clay-secondary m-0 max-w-[72ch]">{section.blurb}</p>
              </header>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {section.entries.map((entry, i) => {
                  const index = (sectionOffsets[sectionIndex] ?? 0) + i;
                  return (
                    <CheatRow
                      key={`${section.id}-${entry.id}`}
                      entry={entry}
                      accent={section.accent}
                      lessons={lessons}
                      mastery={masteryFor(entry)}
                      active={index === active}
                      index={index}
                    />
                  );
                })}
              </ul>
            </ClayPanel>
          ))}
      </div>
    </div>
  );
}
