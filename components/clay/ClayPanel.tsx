import * as React from 'react';
import type { ClayHue } from './Key';

export interface ClayPanelProps extends React.ComponentProps<'section'> {
  hue?: ClayHue;
  size?: 'chip' | 'card' | 'hero';
  sunken?: boolean;
  tint?: boolean;
}

const ELEVATION = {
  chip: 'clay-chip',
  card: 'clay-card',
  hero: 'clay-hero',
} as const;

export function ClayPanel({
  hue = 'violet',
  size = 'card',
  sunken = false,
  tint = false,
  className = '',
  ...rest
}: ClayPanelProps) {
  return (
    <section
      {...rest}
      className={[
        sunken ? 'clay-well' : 'clay',
        ELEVATION[size],
        `hue-${hue}`,
        tint ? 'clay-tint' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
