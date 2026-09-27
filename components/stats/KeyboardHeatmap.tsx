'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { Key, KeyRun } from '@/components/clay/Key';
import { ClayBar } from '@/components/clay/ClayProgress';
import { KEYBOARD_ROWS, capHeat, motionKeys, type CapHeat } from '@/lib/stats';
import { NO_VALUE, percent, plural } from '@/lib/stats/format';

const SPAN_CLASS: Record<string, string> = {
  Esc: 'min-w-[3.75rem]!',
  BS: 'min-w-[3.75rem]!',
  Tab: 'min-w-[3.75rem]!',
  CR: 'min-w-[4.5rem]!',
  Space: 'min-w-[15rem]!',
};

const LEGEND: { mastery: number | undefined; label: string }[] = [
  { mastery: undefined, label: 'Not practised' },
  { mastery: 12, label: '0–24' },
  { mastery: 37, label: '25–49' },
  { mastery: 60, label: '50–69' },
  { mastery: 77, label: '70–84' },
  { mastery: 92, label: '85–100' },
];

export function KeyboardHeatmap({
  mastery,
  counts,
}: {
  mastery: Record<string, number | null>;
  counts: Record<string, number>;
}) {
  const heat = useMemo(() => capHeat(mastery), [mastery]);
  const [active, setActive] = useState<string | null>(null);
  const hovered = useRef<string | null>(null);
  const focused = useRef<string | null>(null);
  const [cursor, setCursor] = useState<[number, number]>([2, 2]);

  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const moveFocus = useRef(false);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    const cap = KEYBOARD_ROWS[cursor[0]]?.[cursor[1]]?.label;
    if (cap !== undefined) buttons.current.get(cap)?.focus();
  }, [cursor]);

  const onKeyDown = useCallback((event: KeyboardEvent, row: number, col: number) => {
    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
    };
    const delta = deltas[event.key];
    if (delta === undefined && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();

    const lastCol = (r: number) => Math.max(0, (KEYBOARD_ROWS[r] ?? []).length - 1);

    let nextRow = row;
    let nextCol = col;
    if (event.key === 'Home') nextCol = 0;
    else if (event.key === 'End') nextCol = lastCol(row);
    else if (delta !== undefined) {
      nextRow = clamp(row + delta[0], 0, KEYBOARD_ROWS.length - 1);
      nextCol = clamp(col + delta[1], 0, lastCol(nextRow));
    }
    moveFocus.current = true;
    setCursor([nextRow, nextCol]);
  }, []);

  const detail = active === null ? null : (heat[active] ?? null);
  const practised = Object.values(heat).filter((c) => c.mastery !== null).length;

  return (
    <ClayPanel hue="mint" size="hero" className="flex flex-col gap-5 px-6 py-7 sm:px-8">
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-2xl">Your keyboard</h2>
        <p className="clay-prose m-0 text-base">
          {practised === 0
            ? 'Solve an exercise and the first caps fill in.'
            : `${plural(practised, 'cap')} practised so far.`}
        </p>
      </div>

      <ul className="clay-secondary m-0 flex list-none flex-wrap items-center gap-x-5 gap-y-2 p-0 text-xs">
        {LEGEND.map((entry) => (
          <li key={entry.label} className="flex items-center gap-2">
            <Key label="" size="sm" mastery={entry.mastery} live={false} />
            <span>{entry.label}</span>
          </li>
        ))}
      </ul>

      <div className="-mx-2 overflow-x-auto px-2 pb-2">
        <div
          role="group"
          aria-label="Keyboard mastery heatmap. Move between keys with the arrow keys."
          className="clay-heat w-max"
          onMouseLeave={() => {
            hovered.current = null;
            setActive(focused.current);
          }}
        >
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="clay-heat-row">
              {row.map((cap, colIndex) => {
                const capData = heat[cap.label];
                return (
                  <button
                    key={cap.label}
                    type="button"
                    ref={(node) => {
                      if (node === null) buttons.current.delete(cap.label);
                      else buttons.current.set(cap.label, node);
                    }}
                    tabIndex={cursor[0] === rowIndex && cursor[1] === colIndex ? 0 : -1}
                    className="clay-focusable cursor-pointer rounded-key border-0 bg-transparent p-0"
                    aria-label={capLabel(cap.label, capData)}
                    onKeyDown={(event) => onKeyDown(event, rowIndex, colIndex)}
                    onFocus={() => {
                      setCursor([rowIndex, colIndex]);
                      focused.current = cap.label;
                      setActive(cap.label);
                    }}
                    onBlur={() => {
                      focused.current = null;
                      setActive(hovered.current);
                    }}
                    onMouseEnter={() => {
                      hovered.current = cap.label;
                      setActive(cap.label);
                    }}
                    onClick={() => setActive(cap.label)}
                  >
                    <Key
                      label={cap.label}
                      mastery={capData?.mastery ?? undefined}
                      className={SPAN_CLASS[cap.label] ?? ''}
                    />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="clay-secondary m-0 text-xs sm:hidden">Scroll sideways for the rest.</p>

      <div
        aria-live="polite"
        className="clay-well clay-card flex min-h-[7.5rem] flex-col gap-3 px-6 py-5"
      >
        {detail === null ? (
          <p className="clay-secondary m-0 text-sm">
            Point at a cap — or Tab in and use the arrow keys — to see what it covers.
          </p>
        ) : (
          <CapDetail detail={detail} counts={counts} />
        )}
      </div>
    </ClayPanel>
  );
}

function CapDetail({ detail, counts }: { detail: CapHeat; counts: Record<string, number> }) {
  return (
    <>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-lg font-semibold">
          The <code className="clay-code">{detail.cap}</code> key
        </span>
        <span className="clay-secondary text-sm">
          {detail.mastery === null
            ? detail.motions.length === 0
              ? 'no motion in the curriculum uses it yet'
              : 'never practised'
            : `${percent(detail.mastery)} across the motions it covers`}
        </span>
      </div>

      {detail.motions.length === 0 ? (
        <p className="clay-secondary m-0 text-sm">
          Nothing yet. Later modules use more of the keyboard.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {detail.motions.slice(0, 8).map((entry) => (
            <li key={entry.motion} className="flex flex-wrap items-center gap-3 text-sm">
              <span className="min-w-[5.5rem]">
                <KeyRun keys={motionKeys(entry.motion)} size="sm" live={false} />
              </span>
              <span className="w-32 shrink-0">
                <ClayBar
                  value={entry.mastery ?? 0}
                  hue={entry.mastery === null ? 'violet' : barHue(entry.mastery)}
                  label={`${entry.motion} mastery`}
                />
              </span>
              <span className="clay-secondary">
                {entry.mastery === null ? NO_VALUE : percent(entry.mastery)}
                {' · '}
                {plural(counts[entry.motion] ?? 0, 'attempt')}
              </span>
            </li>
          ))}
          {detail.motions.length > 8 && (
            <li className="clay-secondary text-sm">
              and {detail.motions.length - 8} more motions on this key.
            </li>
          )}
        </ul>
      )}
    </>
  );
}

function barHue(mastery: number): 'coral' | 'butter' | 'mint' {
  if (mastery < 50) return 'coral';
  if (mastery < 70) return 'butter';
  return 'mint';
}

function capLabel(cap: string, data: CapHeat | undefined): string {
  if (data === undefined || data.motions.length === 0) {
    return `${cap} key, no motions yet`;
  }
  const motions = data.motions.map((m) => m.motion).join(', ');
  if (data.mastery === null) return `${cap} key, never practised. Covers ${motions}`;
  return `${cap} key, ${Math.round(data.mastery)} out of 100. Covers ${motions}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
