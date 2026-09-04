'use client';

import * as React from 'react';
import type { ClayHue } from './Key';

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

const LABEL_MAX_PX = 13;
const MONO_ADVANCE_EM = 0.6;
const MONO_CAP_EM = 0.73;

/** The largest size at which the label's box fits inside the rim's inner edge, with 1px to spare. */
function labelFontPx(size: number, strokeWidth: number, chars: number): number {
  const hole = size - 2 * strokeWidth - 9;
  const fit = (hole - 2) / Math.hypot(MONO_ADVANCE_EM * chars, MONO_CAP_EM);
  return Math.min(LABEL_MAX_PX, Math.floor(fit * 10) / 10);
}

export interface ClayRingProps {
  value: number;
  hue?: ClayHue;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

/** The darkened rim carries WCAG 1.4.11's 3:1 where the pastel arc cannot; see clay.css section 11. */
export function ClayRing({
  value,
  hue = 'violet',
  size = 64,
  strokeWidth = 8,
  label = 'complete',
  className = '',
}: ClayRingProps) {
  const pct = clampPercent(value);
  const r = (size - strokeWidth - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);
  const mid = size / 2;

  return (
    <span
      className={`clay-ring-wrap hue-${hue} ${className}`.trim()}
      role="img"
      aria-label={`${pct}% ${label}`}
      style={{ width: size, height: size }}
    >
      <svg
        className="clay-ring"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle className="clay-ring-track" cx={mid} cy={mid} r={r} strokeWidth={strokeWidth} />
        {pct > 0 && (
          <>
            <circle
              className="clay-ring-rim"
              cx={mid}
              cy={mid}
              r={r}
              strokeWidth={strokeWidth + 3}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
            <circle
              className="clay-ring-arc"
              cx={mid}
              cy={mid}
              r={r}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </>
        )}
      </svg>
      <span
        className="clay-ring-label"
        style={{ fontSize: labelFontPx(size, strokeWidth, `${pct}%`.length) }}
      >
        {pct}%
      </span>
    </span>
  );
}

export interface ClayBarProps {
  value: number;
  ghost?: number;
  hue?: ClayHue;
  label?: string;
  className?: string;
}

export function ClayBar({
  value,
  ghost,
  hue = 'violet',
  label = 'progress',
  className = '',
}: ClayBarProps) {
  const pct = clampPercent(value);
  const ghostPct = ghost === undefined ? undefined : clampPercent(ghost);

  return (
    <div
      className={`clay-bar hue-${hue} ${className}`.trim()}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      {ghostPct !== undefined && (
        <div className="clay-bar-ghost" style={{ width: `${ghostPct}%` }} />
      )}
      <div className="clay-bar-fill" style={{ width: `${pct}%` }} />
      {ghostPct !== undefined && (
        <div className="clay-bar-notch" style={{ left: `${ghostPct}%` }} />
      )}
    </div>
  );
}

export const ClayProgress = { Ring: ClayRing, Bar: ClayBar };
