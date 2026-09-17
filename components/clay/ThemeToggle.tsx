'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyTheme,
  DEFAULT_THEME,
  loadTheme,
  saveTheme,
  THEME_PREFERENCES,
  type ThemePreference,
} from '@/lib/theme';

const LABEL: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
};

function Glyph({ of }: { of: ThemePreference }) {
  const common = {
    width: 15,
    height: 15,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (of === 'light') {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="3.1" />
        <path d="M8 1.4v1.4M8 13.2v1.4M1.4 8h1.4M13.2 8h1.4M3.3 3.3l1 1M11.7 11.7l1 1M12.7 3.3l-1 1M4.3 11.7l-1 1" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M13.4 9.6A5.8 5.8 0 0 1 6.4 2.6a5.8 5.8 0 1 0 7 7Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>(DEFAULT_THEME);
  const group = useRef<HTMLDivElement>(null);

  useEffect(() => setPreference(loadTheme()), []);

  useEffect(() => {
    const onStorage = () => {
      const next = loadTheme();
      setPreference(next);
      applyTheme(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const choose = useCallback((next: ThemePreference) => {
    setPreference(next);
    saveTheme(next);
    applyTheme(next);
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const last = THEME_PREFERENCES.length - 1;
      const from = THEME_PREFERENCES.indexOf(preference);
      let to: number;
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          to = from === last ? 0 : from + 1;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          to = from === 0 ? last : from - 1;
          break;
        case 'Home':
          to = 0;
          break;
        case 'End':
          to = last;
          break;
        default:
          return;
      }
      event.preventDefault();
      const next = THEME_PREFERENCES[to];
      if (next === undefined) return;
      choose(next);
      group.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[to]?.focus();
    },
    [choose, preference],
  );

  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label="Colour theme"
      className="clay-well flex items-center gap-0.5 rounded-full! p-1"
    >
      {THEME_PREFERENCES.map((option) => {
        const selected = option === preference;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            title={LABEL[option]}
            onClick={() => choose(option)}
            onKeyDown={onKeyDown}
            className={[
              'clay-focusable grid h-7 w-7 place-items-center rounded-full',
              'transition-[background-color,box-shadow,color] duration-150',
              selected
                ? 'clay-key hue-violet min-w-0! h-7! w-7! p-0!'
                : 'text-clay-ink-soft hover:text-clay-ink bg-transparent',
            ].join(' ')}
          >
            <Glyph of={option} />
            <span className="clay-sr-only">{LABEL[option]}</span>
          </button>
        );
      })}
    </div>
  );
}
