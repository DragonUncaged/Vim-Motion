'use client';

import { useMemo, useSyncExternalStore } from 'react';
import type { ClayHue } from '@/content/types';
import {
  isKeyDown,
  isSequenceDown,
  normalizeKeyName,
  subscribeKeys,
  tokenizeKeyLabel,
  type KeyName,
} from '@/lib/keyboard';

export type { ClayHue } from '@/content/types';

export type KeySize = 'inline' | 'sm' | 'md' | 'lg';

export interface KeyProps {
  label: string;
  size?: KeySize;
  hue?: ClayHue;
  mastered?: boolean;
  pressed?: boolean;
  disabled?: boolean;
  live?: boolean;
  mastery?: number;
  onClick?: () => void;
  className?: string;
}

const SIZE_CLASS: Record<KeySize, string> = {
  inline: 'clay-key-inline',
  sm: 'clay-key-sm',
  md: '',
  lg: 'clay-key-lg',
};

export function masteryBand(mastery: number | undefined): string {
  if (mastery === undefined) return 'none';
  if (mastery < 25) return '1';
  if (mastery < 50) return '2';
  if (mastery < 70) return '3';
  if (mastery < 85) return '4';
  return '5';
}

const noop = (): (() => void) => () => {};
const serverFalse = (): boolean => false;

function useKeyIsDown(key: KeyName, tokens: KeyName[], live: boolean): boolean {
  return useSyncExternalStore(
    live ? subscribeKeys : noop,
    live ? () => (tokens.length === 1 ? isKeyDown(key) : isSequenceDown(tokens)) : serverFalse,
    serverFalse,
  );
}

export function Key({
  label,
  size = 'md',
  hue = 'violet',
  mastered = false,
  pressed,
  disabled = false,
  live = true,
  mastery,
  onClick,
  className = '',
}: KeyProps) {
  const name = normalizeKeyName(label);
  const tokens = useMemo(() => tokenizeKeyLabel(label), [label]);
  const watching = live && pressed === undefined && !disabled;
  const physicallyDown = useKeyIsDown(name, tokens, watching);
  const isPressed = (pressed ?? physicallyDown) && !disabled;

  const wide = name.length >= 3 && size !== 'lg';

  const state = disabled ? 'disabled' : mastered ? 'mastered' : isPressed ? 'pressed' : 'rest';

  const classes = [
    'clay-key',
    `hue-${hue}`,
    SIZE_CLASS[size],
    wide ? 'clay-key-wide' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const shared = {
    className: classes,
    'data-key': name,
    'data-state': disabled ? 'disabled' : mastered ? 'mastered' : undefined,
    'data-heat': mastery === undefined ? undefined : masteryBand(mastery),
    'data-pressed': isPressed ? '' : undefined,
  } as const;

  if (onClick !== undefined) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} {...shared}>
        {name}
      </button>
    );
  }

  return (
    <kbd {...shared} data-rest={state === 'rest' ? '' : undefined}>
      {name}
    </kbd>
  );
}

export function KeyRun({ keys, ...rest }: Omit<KeyProps, 'label'> & { keys: string[] }) {
  return (
    <span className="inline-flex items-baseline gap-[0.15em]">
      {keys.map((k, i) => (
        <Key key={`${k}-${i}`} label={k} {...rest} />
      ))}
    </span>
  );
}
