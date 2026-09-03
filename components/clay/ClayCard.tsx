import * as React from 'react';
import { Card } from '@/components/ui/card';
import type { ClayHue } from './Key';

export interface ClayCardProps extends React.ComponentProps<typeof Card> {
  hue?: ClayHue;
  tint?: boolean;
  pressable?: boolean;
}

export function ClayCard({
  hue = 'violet',
  tint = false,
  pressable = false,
  className = '',
  ...rest
}: ClayCardProps) {
  return (
    <Card
      {...rest}
      className={[
        'clay clay-card',
        `hue-${hue}`,
        tint ? 'clay-tint' : '',
        pressable ? 'clay-press' : '',
        'border-0 bg-clay-surface shadow-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
