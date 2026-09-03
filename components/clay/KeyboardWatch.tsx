'use client';

import { useEffect, useState } from 'react';
import { subscribeKeys } from '@/lib/keyboard';

/** Announces the last key politely (docs/CONTRACT.md §7). Never calls preventDefault. */
export function KeyboardWatch() {
  const [announced, setAnnounced] = useState('');

  useEffect(
    () =>
      subscribeKeys((event) => {
        if (!event.down) return;
        setAnnounced(event.key);
      }),
    [],
  );

  return (
    <div aria-live="polite" aria-atomic="true" className="clay-sr-only">
      {announced === '' ? '' : `Key ${announced}`}
    </div>
  );
}
