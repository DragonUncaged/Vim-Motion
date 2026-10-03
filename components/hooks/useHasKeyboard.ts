'use client';

import { useSyncExternalStore } from 'react';

const WIDE_ENOUGH = '(min-width: 768px)';
const HAS_KEYS = '(pointer: fine)';

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const queries = [window.matchMedia(WIDE_ENOUGH), window.matchMedia(HAS_KEYS)];
  for (const query of queries) query.addEventListener('change', onChange);
  return () => {
    for (const query of queries) query.removeEventListener('change', onChange);
  };
}

const getSnapshot = (): boolean =>
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia(WIDE_ENOUGH).matches &&
  window.matchMedia(HAS_KEYS).matches;

/** null until the client knows; compare with === true or === false, never truthiness. */
export function useHasKeyboard(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
