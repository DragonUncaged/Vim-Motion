'use client';

import type * as React from 'react';
import { useEffect, useMemo, useState } from 'react';

import { ClayPanel } from '@/components/clay/ClayPanel';
import { Key, type ClayHue } from '@/components/clay/Key';
import { MODE_HUE } from '@/components/editor/mode';
import { normalizeKeyName } from '@/lib/keyboard';
import type { EditorMode } from '@/lib/engine';
import type { HelpEntry } from './catalogue';
import { resolveHelp, type ResolvedGroup } from './resolve';

interface RowProps {
  entry: HelpEntry;
  hue: ClayHue;
  typedLen: number;
  count: number | null;
}

function capWidth(keys: string[]): number {
  const each = keys.map((k) => (normalizeKeyName(k).length >= 3 ? 3.75 : 1.875));
  return each.reduce((a, b) => a + b, 0) + 0.15 * Math.max(0, keys.length - 1);
}

function Row({ entry, hue, typedLen, count }: RowProps) {
  return (
    <li className="grid grid-cols-[var(--cap-col)_minmax(0,1fr)] items-start gap-2.5 py-1.5">
      <span className="flex flex-wrap items-center gap-[0.15rem]">
        {entry.keys.map((k, i) => (
          <Key
            key={`${k}-${i}`}
            label={k}
            size="sm"
            hue={hue}
            pressed={i < typedLen ? true : undefined}
          />
        ))}
      </span>
      <span className="min-w-0">
        <span className="clay-secondary text-[0.8125rem] leading-snug">{entry.what}</span>
        {count !== null && entry.unit !== undefined && (
          <span className="clay-secondary ml-1.5 whitespace-nowrap font-mono text-[0.6875rem] opacity-80">
            · {count} {entry.unit}
          </span>
        )}
      </span>
    </li>
  );
}

interface GroupProps {
  group: ResolvedGroup;
  typedLen: number;
  count: number | null;
  expanded: boolean;
  onToggle: () => void;
}

function Group({ group, typedLen, count, expanded, onToggle }: GroupProps) {
  const hidden = group.entries.length - group.visible;
  const shown = expanded ? group.entries : group.entries.slice(0, group.visible);
  const capCol = `${shown.reduce((w, e) => Math.max(w, capWidth(e.keys)), 1.875)}rem`;
  return (
    <section className="border-t border-[color-mix(in_oklab,var(--clay-violet)_18%,transparent)] pt-3 first:border-t-0 first:pt-0">
      <h3 className="m-0 mb-1 font-display text-[0.9375rem] font-semibold">{group.title}</h3>
      <ul className="m-0 list-none p-0" style={{ '--cap-col': capCol } as React.CSSProperties}>
        {shown.map((entry) => (
          <Row
            key={entry.keys.join('')}
            entry={entry}
            hue={group.hue}
            typedLen={typedLen}
            count={count}
          />
        ))}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="clay-btn clay-btn-ghost hue-violet mt-1 h-7 px-3 text-[0.75rem]"
        >
          {expanded ? 'Show fewer' : `Show ${hidden} more`}
        </button>
      )}
    </section>
  );
}

export interface HelpPanelProps {
  mode: EditorMode;
  pendingKeys: string;
  live?: boolean;
  className?: string;
}

export function HelpPanel({ mode, pendingKeys, live = true, className = '' }: HelpPanelProps) {
  const view = useMemo(() => resolveHelp(mode, pendingKeys), [mode, pendingKeys]);
  const hue = MODE_HUE[mode];

  const signature = `${mode}|${pendingKeys}`;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  useEffect(() => setExpanded({}), [signature]);

  return (
    <ClayPanel
      hue={hue}
      className={`flex flex-col gap-3 px-5 py-5 ${className}`.trim()}
      aria-label="Key help"
    >
      <header className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="m-0 text-lg">{view.title}</h2>
          {view.typed.length > 0 && (
            <span className="flex items-center gap-[0.15rem]" data-testid="help-assembling">
              {view.typed.map((k, i) => (
                <Key key={`${k}-${i}`} label={k} size="sm" hue={hue} pressed live={false} />
              ))}
              <span aria-hidden="true" className="clay-secondary font-mono text-sm">
                …
              </span>
            </span>
          )}
        </div>
        {view.note !== null && live && (
          <p className="clay-secondary m-0 text-[0.8125rem]">{view.note}</p>
        )}
        {view.register !== null && (
          <p className="clay-secondary m-0 text-[0.8125rem]">
            Going into register <span className="clay-code">{view.register}</span>.
          </p>
        )}
      </header>

      {view.count !== null && (
        <ClayPanel hue="violet" tint size="chip" className="px-3.5 py-2.5">
          <p className="clay-secondary m-0 text-[0.8125rem]">
            A count of <strong className="font-mono">{view.count}</strong> multiplies what comes
            next: <span className="clay-code">{view.count}w</span> is {view.count} words forward,{' '}
            <span className="clay-code">{view.count}dd</span> deletes {view.count} lines.
          </p>
        </ClayPanel>
      )}

      {view.groups.length > 0 && (
        <div className="flex flex-col gap-3">
          {view.groups.map((group) => (
            <Group
              key={group.id}
              group={group}
              typedLen={view.typedLen}
              count={view.count}
              expanded={expanded[group.id] === true}
              onToggle={() =>
                setExpanded((prev) => ({ ...prev, [group.id]: prev[group.id] !== true }))
              }
            />
          ))}
        </div>
      )}

      {view.groups.length === 0 && (
        <p className="clay-secondary m-0 flex items-center gap-2 text-[0.8125rem]">
          <Key label="Esc" size="sm" hue={hue} />
          <span>cancels what vim is holding.</span>
        </p>
      )}
    </ClayPanel>
  );
}
