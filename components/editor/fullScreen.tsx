'use client';

/** Never requestFullscreen() and never an Esc binding: browsers exit native fullscreen on Esc. */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { ClayButton } from '@/components/clay/ClayButton';
import type { ClayHue } from '@/components/clay/Key';

/** --clay-editor-rim, not --clay-ink: it is the one colour deep in both themes. */
const SCRIM = 'color-mix(in srgb, var(--clay-editor-rim) 88%, transparent)';

export interface EditorFullScreen {
  on: boolean;
  toggle: () => void;
  heldHeight: number | null;
}

/** Owns no DOM: a portal would remount CodeMirror and lose the buffer and the attempt. */
export function useEditorFullScreen(frameRef: RefObject<HTMLElement | null>): EditorFullScreen {
  const [on, setOn] = useState(false);
  const [heldHeight, setHeldHeight] = useState<number | null>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  const toggle = useCallback(() => {
    if (on) {
      setOn(false);
      setHeldHeight(null);
      return;
    }
    restoreFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setHeldHeight(frameRef.current?.getBoundingClientRect().height ?? null);
    setOn(true);
  }, [on, frameRef]);

  useEffect(() => {
    if (!on) return;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    const paddingRight = root.style.paddingRight;
    const gutter = window.innerWidth - root.clientWidth;
    root.style.overflow = 'hidden';
    if (gutter > 0) root.style.paddingRight = `${gutter}px`;
    return () => {
      root.style.overflow = overflow;
      root.style.paddingRight = paddingRight;
    };
  }, [on]);

  useEffect(() => {
    if (on) return;
    const target = restoreFocus.current;
    restoreFocus.current = null;
    if (target?.isConnected) target.focus();
  }, [on]);

  return { on, toggle, heldHeight };
}

export function FullScreenPlaceholder({ height }: { height: number | null }) {
  return (
    <div aria-hidden="true" style={{ height: height ?? 0 }} data-testid="editor-placeholder" />
  );
}

/** Not clickable: a stray click in the margin must not end a run. */
export function FullScreenScrim() {
  return <div aria-hidden="true" className="fixed inset-0 z-40" style={{ background: SCRIM }} />;
}

export interface FullScreenToggleProps {
  on: boolean;
  onToggle: () => void;
  hue: ClayHue;
  ref?: RefObject<HTMLButtonElement | null>;
}

export function FullScreenToggle({ on, onToggle, hue, ref }: FullScreenToggleProps) {
  return (
    <ClayButton
      ref={ref}
      intent="ghost"
      hue={hue}
      onClick={onToggle}
      aria-pressed={on}
      data-testid="fullscreen-toggle"
      className="font-sans text-[0.6875rem]! font-semibold! px-2.5! py-1!"
    >
      {on ? 'Leave full screen' : 'Full screen'}
    </ClayButton>
  );
}
