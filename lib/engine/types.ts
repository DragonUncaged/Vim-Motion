/** docs/CONTRACT.md §11. Type imports only: a value import reaching vim-bridge puts ~240 kB of editor in a route. */

import type { ReactNode } from 'react';
import type { EditorMode, LessonLanguage, Pos } from '@/content/types';
import type { VimBridge } from './vim-bridge';

export type { EditorMode, Pos };

export interface SnapshotSelection {
  from: Pos;
  to: Pos;
  /** Visual-block only, as a bounding box of N ranges; never write a `selection` goal for a `<C-v>` exercise. */
  block?: { topLine: number; bottomLine: number; leftCh: number; rightCh: number };
}

/** No key history on purpose: a goal is decided from the outcome alone. */
export interface EditorSnapshot {
  doc: string;
  cursor: Pos;
  selection: SnapshotSelection | null;
  mode: EditorMode;
  pendingKeys: string;
  registers: Record<string, string>;
}

export interface KeystrokeRecord {
  seq: number;
  /** Vim notation: 'd', 'w', '<Esc>', '<C-d>', '<Space>'. */
  key: string;
  /** `performance.now()` at keydown. */
  at: number;
  /** Mode BEFORE the key was processed. */
  mode: EditorMode;
  /** docs/CONTRACT.md §6: an operator key alone completes nothing, so it is never wasted. */
  wasted: boolean;
  pendingAdvanced: boolean;
  undoDepth: number;
  inPrompt: boolean;
  escapeHatch: boolean;
  undone: boolean;
}

/** docs/CONTRACT.md §11, with the numbers defined in docs/CONTRACT.md §6. */
export interface AttemptState {
  status: 'idle' | 'running' | 'solved' | 'failed';
  /** 0 while running; a live figure comes from useLiveElapsed, because ticking here re-rendered the editor 10 times a second. */
  elapsedMs: number;
  /** An origin, not the first keystroke: each away spell pushes it forward. Null unless the clock is running. */
  runningSince: number | null;
  accumulatedMs: number;
  keystrokes: number;
  wastedKeys: number;
  efficiency: number;
  accuracy: number;
  kpm: number;
}

/** docs/CONTRACT.md §11, plus the additive block below. */
export interface VimEditorProps {
  doc: string;
  language: LessonLanguage;
  initialCursor?: Pos;
  setupKeys?: string;
  autoFocus?: boolean;
  onSnapshot?: (s: EditorSnapshot) => void;
  /** `at` is performance.now() at keydown, not when this runs a tick later. */
  onKeystroke?: (key: string, s: EditorSnapshot, at: number) => void;
  className?: string;

  /* -- additive, beyond docs/CONTRACT.md §11 -- */

  onReady?: (bridge: VimBridge) => void;
  onModeChange?: (mode: EditorMode) => void;
  onReleaseFocus?: () => void;
  /** Focus anywhere in view.dom, so vim's command line counts as inside the editor. */
  onFocusChange?: (focused: boolean) => void;
  footer?: ReactNode;
  /** Memoise it and keep it null until the attempt ends; a new node each render defeats memo(VimEditor). */
  resultBar?: ReactNode;
  onFullScreenChange?: (on: boolean) => void;
  title?: string;
  showFocusOverlay?: boolean;
  allowFullScreen?: boolean;
}
