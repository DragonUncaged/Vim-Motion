'use client';

import { useHasKeyboard } from '@/components/hooks/useHasKeyboard';
import { Key } from '@/components/clay/Key';

const HERO_KEYS = ['h', 'j', 'k', 'l', 'w', 'd', 'c', 'i', '<Esc>'];

export function HeroKeyStrip() {
  const touch = useHasKeyboard() === false;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {HERO_KEYS.map((k) => (
          <Key key={k} label={k} hue="violet" live={!touch} />
        ))}
      </div>
      <p className="clay-secondary m-0 max-w-[46ch]">
        {touch
          ? 'The keys the first lessons teach.'
          : 'Press one — these caps light up as you type.'}
      </p>
    </div>
  );
}
