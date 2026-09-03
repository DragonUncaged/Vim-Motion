'use client';

import * as React from 'react';
import { Slot } from 'radix-ui';
import type { ClayHue } from './Key';

export type ClayButtonIntent = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ClayButtonProps extends React.ComponentProps<'button'> {
  intent?: ClayButtonIntent;
  hue?: ClayHue;
  asChild?: boolean;
}

const INTENT_CLASS: Record<ClayButtonIntent, string> = {
  primary: 'clay-btn-primary',
  secondary: 'clay-btn-secondary',
  ghost: 'clay-btn-ghost',
  danger: 'clay-btn-danger',
};

export function ClayButton({
  intent = 'secondary',
  hue = 'violet',
  asChild = false,
  className = '',
  type,
  ...rest
}: ClayButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      {...rest}
      type={asChild ? undefined : (type ?? 'button')}
      className={['clay-btn', INTENT_CLASS[intent], `hue-${hue}`, className]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
