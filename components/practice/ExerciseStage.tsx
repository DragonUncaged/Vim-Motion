'use client';

/** Judged on editor state, never on keys (docs/CONTRACT.md §4 rule 1). */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { ClayButton } from '@/components/clay/ClayButton';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { RichText } from '@/components/prose/RichText';
import VimEditorLoader from '@/components/editor/VimEditorLoader';
import type { EditorMode } from '@/content/types';
import { useExercise } from '@/lib/engine';
import type { AttemptState } from '@/lib/engine';
import type { DrillOutcome, DrillResult, LoadedDrillItem } from '@/lib/drills';
import { useProgress } from '@/lib/progress';
import { duration } from '@/lib/stats/format';

const FILE_EXTENSION = { text: 'txt', tsx: 'tsx', go: 'go', cpp: 'cpp' } as const;

const OUTCOME_WORD: Record<DrillOutcome, string> = {
  solved: 'Solved',
  skipped: 'Skipped',
  failed: 'Attempt ended',
};

function toResult(item: LoadedDrillItem, state: AttemptState, outcome: DrillOutcome): DrillResult {
  return {
    item,
    outcome,
    reached: outcome === 'solved',
    timeMs: state.elapsedMs,
    keystrokes: state.keystrokes,
    par: item.exercise.par,
    efficiency: state.efficiency,
    accuracy: state.accuracy,
  };
}

export interface ExerciseStageProps {
  item: LoadedDrillItem;
  onFinished: (result: DrillResult) => void;
  renderTop?: (state: AttemptState, solved: boolean) => ReactNode;
  renderFinished?: (result: DrillResult) => ReactNode;
  announce?: (message: string) => void;
}

export function ExerciseStage({
  item,
  onFinished,
  renderTop,
  renderFinished,
  announce,
}: ExerciseStageProps) {
  const { exercise } = item;
  const [hintShown, setHintShown] = useState(false);
  const [mode, setMode] = useState<EditorMode>('normal');
  const [result, setResult] = useState<DrillResult | null>(null);
  const doneRef = useRef(false);
  const finishedRef = useRef<HTMLDivElement | null>(null);
  /* Expanded, the finished chrome moves into the frame; a copy behind the scrim would still take focus. */
  const [expanded, setExpanded] = useState(false);
  const { storageOk } = useProgress();

  const cbRef = useRef({ onFinished, announce, item });
  cbRef.current = { onFinished, announce, item };

  /** A skip records no attempt: it would score 0 and let a learner flatten their own mastery. */
  const settle = useCallback((state: AttemptState, outcome: DrillOutcome) => {
    if (doneRef.current) return;
    doneRef.current = true;
    const next = toResult(cbRef.current.item, state, outcome);
    setResult(next);
    cbRef.current.onFinished(next);
  }, []);

  const handleSolved = useCallback(
    (state: AttemptState) => {
      cbRef.current.announce?.(
        `Solved in ${(state.elapsedMs / 1000).toFixed(1)} seconds and ${state.keystrokes} ` +
          `keystroke${state.keystrokes === 1 ? '' : 's'}.`,
      );
      settle(state, 'solved');
    },
    [settle],
  );

  const { state, editorProps, reset, failure, nudge, justSolved, focus, elapsedNow } = useExercise(
    exercise,
    {
      lessonSlug: item.lessonSlug,
      language: item.language,
      onSolved: handleSolved,
      onReleaseFocus: () => finishedRef.current?.focus(),
    },
  );

  useEffect(() => {
    if (state.status === 'failed') settle(state, 'failed');
  }, [state, settle]);

  useEffect(() => {
    if (result !== null) finishedRef.current?.focus();
  }, [result, expanded]);

  useEffect(() => setHintShown(false), [item.key]);

  const finished = result !== null;

  // elapsedNow(), not state: state.elapsedMs is 0 until the attempt ends.
  const skip = () => {
    const spent = elapsedNow();
    settle({ ...state, elapsedMs: spent, accumulatedMs: spent, runningSince: null }, 'skipped');
  };

  const runChrome = result === null ? null : renderFinished?.(result);

  const finishedChrome =
    result === null ? null : (
      <div
        ref={finishedRef}
        tabIndex={-1}
        className="rounded-[var(--r-card)] outline-none focus-visible:outline-[length:var(--clay-focus-width)] focus-visible:outline-[var(--clay-focus)]"
      >
        {failure !== null && (
          <ClayPanel hue="coral" tint size="chip" className="mb-4 px-5 py-4">
            <RichText as="p" className="clay-prose m-0 text-sm">
              {failure}
            </RichText>
          </ClayPanel>
        )}
        {runChrome}
      </div>
    );

  const resultBar =
    !expanded || result === null ? null : (
      <div className="flex flex-col gap-3">
        {runChrome == null || runChrome === false ? (
          <ClayPanel hue={result.reached ? 'mint' : 'coral'} tint className="px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <h3 className="m-0 text-base">{OUTCOME_WORD[result.outcome]}</h3>
              <dl className="m-0 flex flex-wrap items-center gap-x-5 gap-y-1">
                {[
                  ['time', duration(result.timeMs)],
                  ['keystrokes', `${result.keystrokes} of ${result.par}`],
                  ['efficiency', `${Math.round(result.efficiency)}%`],
                  ['accuracy', `${Math.round(result.accuracy * 100)}%`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline gap-1.5">
                    <dd className="m-0 font-mono text-sm font-bold tabular-nums">{value}</dd>
                    <dt className="clay-secondary text-xs">{label}</dt>
                  </div>
                ))}
              </dl>
            </div>
          </ClayPanel>
        ) : null}
        {finishedChrome}
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      {renderTop?.(state, finished && result.reached)}

      <ClayPanel hue={mode === 'insert' ? 'mint' : 'violet'} className="px-6 py-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="clay-secondary font-mono text-xs font-bold">{item.lessonTitle}</span>
          <span className="clay-secondary text-xs">par {exercise.par} keys</span>
        </div>
        <RichText as="p" className="clay-prose mt-2 mb-0 text-base">
          {exercise.prompt}
        </RichText>

        {!storageOk && (
          <p className="clay-prose mt-2 mb-0 text-sm" data-testid="storage-notice">
            This browser is not storing attempts, so this one will not count towards your stats.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {exercise.hint !== undefined && !hintShown && (
            <ClayButton intent="ghost" onClick={() => setHintShown(true)}>
              Show a hint
            </ClayButton>
          )}
          {!finished && (
            <>
              <ClayButton
                intent="ghost"
                onClick={() => {
                  reset();
                  focus();
                }}
              >
                Start this one over
              </ClayButton>
              <ClayButton intent="ghost" onClick={skip}>
                Skip it
              </ClayButton>
            </>
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
        key={item.key}
        onModeChange={setMode}
        className={justSolved ? 'clay-puff' : ''}
        title={`${item.lessonSlug}.${FILE_EXTENSION[item.language]}`}
        showFocusOverlay={!finished}
        resultBar={resultBar}
        onFullScreenChange={setExpanded}
        allowFullScreen
      />

      {nudge !== null && !finished && (
        <ClayPanel hue="butter" tint size="chip" className="px-4 py-3">
          <RichText as="p" className="clay-prose m-0 text-sm">
            {nudge}
          </RichText>
        </ClayPanel>
      )}

      {!expanded && finishedChrome}
    </div>
  );
}
