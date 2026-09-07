'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Exercise, LessonLanguage } from '@/content/types';
import { MAX_TIMELINE_KEYS, recordAttempt } from '@/lib/progress';
import type { GhostKey } from '@/lib/progress';
import { accuracy, efficiency, kpm } from '@/lib/stats/metrics';
import { evaluateGoal } from './goal';
import type { AttemptState, EditorSnapshot, VimEditorProps } from './types';
import type { VimBridge } from './vim-bridge';

const ALWAYS_ALLOWED = new Set(['<Esc>', '<C-c>']);

const ARROWS = new Set(['<Left>', '<Right>', '<Up>', '<Down>']);

const ARROW_NUDGE = 'Arrow keys work, but `hjkl` is faster — your hand stays on the home row.';

export function computeMetrics(
  par: number,
  keystrokes: number,
  wastedKeys: number,
  elapsedMs: number,
): Pick<AttemptState, 'efficiency' | 'accuracy' | 'kpm'> {
  return {
    efficiency: efficiency(par, keystrokes),
    accuracy: accuracy(wastedKeys, keystrokes),
    kpm: kpm(keystrokes, elapsedMs),
  };
}

export function toTimeline(keys: readonly GhostKey[]): GhostKey[] | undefined {
  if (keys.length === 0 || keys.length > MAX_TIMELINE_KEYS) return undefined;
  return keys.map((k) => ({ key: k.key, ms: k.ms }));
}

const idleState = (): AttemptState => ({
  status: 'idle',
  elapsedMs: 0,
  runningSince: null,
  accumulatedMs: 0,
  keystrokes: 0,
  wastedKeys: 0,
  efficiency: 100,
  accuracy: 1,
  kpm: 0,
});

/** Attempt time is now minus startedAt minus pausedMs, frozen at pausedSince while away; runningSince is startedAt + pausedMs. */
export interface RunClock {
  startedAt: number | null;
  pausedMs: number;
  pausedSince: number | null;
  finished: boolean;
  keys: GhostKey[];
}

export const idleClock = (): RunClock => ({
  startedAt: null,
  pausedMs: 0,
  pausedSince: null,
  finished: false,
  keys: [],
});

export function elapsedAt(run: RunClock, now: number): number {
  if (run.startedAt === null) return 0;
  return Math.max(0, (run.pausedSince ?? now) - run.startedAt - run.pausedMs);
}

export function pauseAt(run: RunClock, now: number): void {
  run.pausedSince ??= now;
}

export function resumeAt(run: RunClock, now: number): number | null {
  if (run.startedAt === null) return null;
  if (run.pausedSince !== null) {
    run.pausedMs += now - run.pausedSince;
    run.pausedSince = null;
  }
  return run.startedAt + run.pausedMs;
}

export interface UseExerciseOptions {
  lessonSlug?: string;
  language?: LessonLanguage;
  autoFocus?: boolean;
  onSolved?: (state: AttemptState) => void;
  onReleaseFocus?: () => void;
}

export interface UseExerciseResult {
  state: AttemptState;
  snapshot: EditorSnapshot | null;
  editorProps: VimEditorProps;
  reset: () => void;
  failure: string | null;
  nudge: string | null;
  elapsedNow: () => number;
  justSolved: boolean;
  focus: () => void;
}

export function useExercise(
  exercise: Exercise,
  options: UseExerciseOptions = {},
): UseExerciseResult {
  const { lessonSlug, language = 'text', autoFocus = true, onSolved, onReleaseFocus } = options;

  const bridgeRef = useRef<VimBridge | null>(null);
  const [state, setState] = useState<AttemptState>(idleState);
  const [snapshot, setSnapshot] = useState<EditorSnapshot | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [nudge, setNudge] = useState<string | null>(null);
  const [justSolved, setJustSolved] = useState(false);

  const runRef = useRef<RunClock>(idleClock());
  const focusedRef = useRef(false);
  const cbRef = useRef({ onSolved, exercise, lessonSlug });
  cbRef.current = { onSolved, exercise, lessonSlug };

  const elapsedNow = useCallback(() => {
    const run = runRef.current;
    if (run.startedAt === null || run.finished) return 0;
    return elapsedAt(run, performance.now());
  }, []);

  const handleFocusChange = useCallback((next: boolean) => {
    if (focusedRef.current === next) return;
    focusedRef.current = next;
    const run = runRef.current;
    if (run.startedAt === null || run.finished) return;
    const now = performance.now();
    if (next) {
      const origin = resumeAt(run, now);
      setState((prev) => (prev.status === 'running' ? { ...prev, runningSince: origin } : prev));
      return;
    }
    pauseAt(run, now);
    const banked = elapsedAt(run, now);
    setState((prev) =>
      prev.status === 'running' ? { ...prev, runningSince: null, accumulatedMs: banked } : prev,
    );
  }, []);

  const finish = useCallback((solved: boolean, elapsedMs: number) => {
    const bridge = bridgeRef.current;
    if (!bridge) return;
    runRef.current.finished = true;

    const keystrokes = bridge.count();
    const wastedKeys = bridge.wastedCount();
    const { exercise: ex, lessonSlug: slug, onSolved: solvedCb } = cbRef.current;
    const metrics = computeMetrics(ex.par, keystrokes, wastedKeys, elapsedMs);
    const next: AttemptState = {
      status: solved ? 'solved' : 'failed',
      elapsedMs,
      runningSince: null,
      accumulatedMs: elapsedMs,
      keystrokes,
      wastedKeys,
      ...metrics,
    };
    setState(next);

    if (slug !== undefined) {
      const timeline = solved ? toTimeline(runRef.current.keys) : undefined;
      recordAttempt({
        exerciseId: ex.id,
        lessonSlug: slug,
        motions: ex.motions,
        timeMs: Math.round(elapsedMs),
        keystrokes,
        wastedKeys,
        par: ex.par,
        solved,
        at: Date.now(),
        ...(timeline === undefined ? {} : { timeline }),
      });
    }

    if (solved) {
      setJustSolved(true);
      solvedCb?.(next);
    }
  }, []);

  useEffect(() => {
    if (!justSolved) return;
    const id = window.setTimeout(() => setJustSolved(false), 900);
    return () => window.clearTimeout(id);
  }, [justSolved]);

  const handleKeystroke = useCallback(
    (key: string, snap: EditorSnapshot, at: number) => {
      const run = runRef.current;
      if (run.finished) return;
      const ex = cbRef.current.exercise;

      // Use the keydown time `at`, not now: this runs a tick later, and one-key solves recorded 0 ms.
      if (run.startedAt === null) {
        run.startedAt = at;
        run.pausedMs = 0;
        // The first Esc of the Esc Esc hatch blurs the buffer, so the clock can start already paused.
        run.pausedSince = focusedRef.current ? null : at;
        setState((s) => ({
          ...s,
          status: 'running',
          runningSince: focusedRef.current ? at : null,
          accumulatedMs: 0,
        }));
      }

      // KeystrokeRecord.at cannot be converted after a pause; one entry past the cap marks too many.
      if (run.keys.length <= MAX_TIMELINE_KEYS) {
        run.keys.push({ key, ms: Math.max(0, Math.round(elapsedAt(run, at))) });
      }

      if (ARROWS.has(key) && ex.allowedKeys === undefined) {
        setNudge(ARROW_NUDGE);
      }

      if (
        ex.allowedKeys !== undefined &&
        !ALWAYS_ALLOWED.has(key) &&
        !ex.allowedKeys.includes(key)
      ) {
        const allowed = ex.allowedKeys.map((k) => `\`${k}\``).join(', ');
        setFailure(
          `This one is about ${allowed} only, so \`${key}\` ends the attempt. Reset and go again.`,
        );
        finish(false, elapsedAt(run, performance.now()));
        return;
      }

      setSnapshot(snap);

      if (evaluateGoal(ex.goal, snap)) {
        finish(true, elapsedAt(run, performance.now()));
        return;
      }

      const bridge = bridgeRef.current;
      if (bridge) {
        const keystrokes = bridge.count();
        const wastedKeys = bridge.wastedCount();
        setState((s) => ({
          ...s,
          keystrokes,
          wastedKeys,
          ...computeMetrics(ex.par, keystrokes, wastedKeys, elapsedAt(run, performance.now())),
        }));
      }
    },
    [finish],
  );

  const handleSnapshot = useCallback((snap: EditorSnapshot) => {
    // Never evaluate the goal here: some goals already hold at mount (mode, cursor, leftover registers).
    if (!runRef.current.finished) setSnapshot(snap);
  }, []);

  const handleReady = useCallback((bridge: VimBridge) => {
    bridgeRef.current = bridge;
    setSnapshot(bridge.snapshot());
  }, []);

  const reset = useCallback(() => {
    const bridge = bridgeRef.current;
    runRef.current = idleClock();
    setState(idleState());
    setFailure(null);
    setNudge(null);
    setJustSolved(false);
    if (!bridge) return;
    bridge.reset({
      doc: cbRef.current.exercise.startDoc,
      cursor: cbRef.current.exercise.startCursor,
      setupKeys: cbRef.current.exercise.setupKeys,
    });
    setSnapshot(bridge.snapshot());
    bridge.focus();
  }, []);

  const focus = useCallback(() => bridgeRef.current?.focus(), []);

  useEffect(() => {
    runRef.current = idleClock();
    setState(idleState());
    setFailure(null);
    setNudge(null);
    setJustSolved(false);
    setSnapshot(null);
  }, [exercise.id, exercise.startDoc]);

  const editorProps: VimEditorProps = useMemo(
    () => ({
      doc: exercise.startDoc,
      language,
      initialCursor: exercise.startCursor,
      setupKeys: exercise.setupKeys,
      autoFocus,
      onKeystroke: handleKeystroke,
      onSnapshot: handleSnapshot,
      onReady: handleReady,
      onReleaseFocus,
      onFocusChange: handleFocusChange,
    }),
    [
      exercise.startDoc,
      exercise.startCursor,
      exercise.setupKeys,
      language,
      autoFocus,
      handleKeystroke,
      handleSnapshot,
      handleReady,
      onReleaseFocus,
      handleFocusChange,
    ],
  );

  return {
    state,
    snapshot,
    editorProps,
    reset,
    failure,
    nudge,
    elapsedNow,
    justSolved,
    focus,
  };
}
