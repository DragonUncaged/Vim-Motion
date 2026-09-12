import { ClayPanel } from '@/components/clay/ClayPanel';
import { Key } from '@/components/clay/Key';

/** docs/CONTRACT.md §7. */
export function MobileNotice({ className = '' }: { className?: string }) {
  return (
    <ClayPanel hue="butter" tint className={`px-6 py-6 ${className}`.trim()}>
      <div className="mb-4 flex items-center gap-2">
        <Key label="h" hue="butter" size="sm" live={false} />
        <Key label="j" hue="butter" size="sm" live={false} />
        <Key label="k" hue="butter" size="sm" live={false} />
        <Key label="l" hue="butter" size="sm" live={false} />
      </div>
      <h2 className="m-0 text-xl">The exercises need a keyboard</h2>
      <p className="clay-prose mt-2 text-base">
        Come back on a laptop and this becomes a real editor.
      </p>
    </ClayPanel>
  );
}
