import Link from 'next/link';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { Key } from '@/components/clay/Key';
import { HERO_EDITOR_MIN_HEIGHT } from './HeroPlaceholder';

/** docs/CONTRACT.md §7. */
export function HeroKeyboardNotice() {
  return (
    <ClayPanel
      hue="butter"
      tint
      className="flex flex-col justify-center gap-4 px-6 py-7"
      style={{ minHeight: HERO_EDITOR_MIN_HEIGHT }}
    >
      <div className="flex flex-wrap items-center gap-2">
        {['h', 'j', 'k', 'l'].map((k) => (
          <Key key={k} label={k} hue="butter" size="sm" live={false} />
        ))}
      </div>
      <h2 className="m-0 text-xl">The editor wants a keyboard</h2>
      <p className="clay-prose m-0 text-base">
        The lessons run real vim, so they need real keys. On a laptop this panel is a live editor.
      </p>
      <div>
        <Link href="/cheatsheet" className="clay-btn clay-btn-primary px-5 py-3">
          Open the cheatsheet
        </Link>
      </div>
    </ClayPanel>
  );
}
