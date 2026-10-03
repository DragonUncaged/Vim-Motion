'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useHasKeyboard } from '@/components/hooks/useHasKeyboard';
import { HeroKeyboardNotice } from './HeroKeyboardNotice';
import { HeroPlaceholder } from './HeroPlaceholder';

/** Keeps CodeMirror out of `/`'s first load (docs/CONTRACT.md §1); check next build's route table after edits. */

/** The brief: `dw` pressable within two seconds of load. */
const IDLE_DEADLINE_MS = 1200;

const HeroDemo = dynamic(() => import('./HeroDemo'), {
  ssr: false,
  loading: () => <HeroPlaceholder />,
});

export function HeroEditorMount() {
  const keyboard = useHasKeyboard();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (keyboard !== true || armed) return;

    const arm = (): void => setArmed(true);

    const idle =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(arm, { timeout: IDLE_DEADLINE_MS })
        : undefined;
    const timer = window.setTimeout(arm, IDLE_DEADLINE_MS);

    const events = ['pointerdown', 'keydown', 'pointermove', 'wheel'] as const;
    for (const event of events) {
      window.addEventListener(event, arm, { once: true, passive: true });
    }

    return () => {
      if (idle !== undefined) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
      for (const event of events) window.removeEventListener(event, arm);
    };
  }, [keyboard, armed]);

  if (keyboard === false) return <HeroKeyboardNotice />;
  if (keyboard === true && armed) return <HeroDemo />;
  return <HeroPlaceholder />;
}
