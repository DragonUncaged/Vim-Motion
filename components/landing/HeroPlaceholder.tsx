import { ClayPanel } from '@/components/clay/ClayPanel';
import { Key } from '@/components/clay/Key';

/** The loaded editor's exact height (docs/CONTRACT.md §1). */
export const HERO_EDITOR_MIN_HEIGHT = 340;

export function HeroPlaceholder({ label = 'Loading the editor' }: { label?: string }) {
  return (
    <ClayPanel
      hue="blue"
      className="flex flex-col gap-3 px-5 py-5"
      style={{ minHeight: HERO_EDITOR_MIN_HEIGHT }}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <Key label="i" size="sm" hue="blue" live={false} />
        <span className="font-[family-name:var(--font-mono)] text-[0.8125rem] text-[var(--clay-ink-soft)]">
          hero.txt
        </span>
      </div>
      <div className="clay-well flex flex-1 flex-col gap-3 px-5 py-5">
        <span className="block h-3 w-3/5 rounded-full bg-[var(--clay-sunken)] opacity-70" />
        <span className="block h-3 w-4/5 rounded-full bg-[var(--clay-sunken)] opacity-50" />
        <span className="block h-3 w-2/5 rounded-full bg-[var(--clay-sunken)] opacity-40" />
      </div>
      <span className="font-[family-name:var(--font-mono)] text-[0.75rem] text-[var(--clay-ink-muted)]">
        {label}
      </span>
    </ClayPanel>
  );
}
