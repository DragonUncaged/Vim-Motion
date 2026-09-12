'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(min-width: 1024px)';

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

const getSnapshot = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(QUERY).matches;

/** null until the client knows; compare with === true. */
export function useIsWideScreen(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
