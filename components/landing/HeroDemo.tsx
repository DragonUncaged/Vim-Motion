'use client';

import { useState } from 'react';
import Link from 'next/link';
import VimEditor from '@/components/editor/VimEditor';
import { ClayButton } from '@/components/clay/ClayButton';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { Key } from '@/components/clay/Key';
import { RichText } from '@/components/prose/RichText';
import { useExercise } from '@/lib/engine';
import type { Exercise } from '@/content/types';

/** No lessonSlug, so nothing is recorded (docs/CONTRACT.md §0). */
const HERO_EXERCISE: Exercise = {
  id: 'hero-delete-slow',
  prompt: 'Your cursor is on `slow`. Press [[dw]] to delete the word.',
  startDoc: 'the slow way is the long way',
  startCursor: { line: 0, ch: 4 },
  goal: { type: 'doc', expected: 'the way is the long way' },
  solution: 'dw',
  par: 2,
  motions: ['dw'],
};

/** Imports VimEditor directly: HeroEditorMount's dynamic import is already the boundary. */
export default function HeroDemo() {
  const [everSolved, setEverSolved] = useState(false);

  const { state, editorProps, reset, justSolved, focus } = useExercise(HERO_EXERCISE, {
    // No autofocus: it would take the first keystroke of a visitor still reading.
    autoFocus: false,
    onSolved: () => setEverSolved(true),
  });

  const solved = state.status === 'solved';

  return (
    <div className="flex flex-col gap-3">
      <VimEditor
        {...editorProps}
        className={justSolved ? 'clay-puff' : ''}
        title="hero.txt"
        showFocusOverlay={!solved}
      />

      <ClayPanel
        hue={solved ? 'mint' : 'violet'}
        tint={solved}
        size="chip"
        className="flex flex-col gap-3 px-5 py-4"
      >
        {solved ? (
          <>
            <p className="clay-prose m-0 text-base">
              Judged on the result, not the keys — <code className="clay-code">de</code> and{' '}
              <code className="clay-code">vex</code> would have counted too.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <ClayButton asChild intent="primary">
                <Link href="/learn">Start the curriculum</Link>
              </ClayButton>
              <ClayButton
                intent="ghost"
                onClick={() => {
                  reset();
                  focus();
                }}
              >
                Try it again
              </ClayButton>
            </div>
          </>
        ) : (
          <>
            <RichText as="p" className="clay-prose m-0 text-base">
              {HERO_EXERCISE.prompt}
            </RichText>
            <div className="flex flex-wrap items-center gap-2">
              <Key label="d" hue="violet" />
              <Key label="w" hue="violet" />
              <span className="clay-secondary">
                {everSolved
                  ? 'Go again whenever you like.'
                  : 'Click the editor first, then press them.'}
              </span>
            </div>
          </>
        )}
      </ClayPanel>
    </div>
  );
}
