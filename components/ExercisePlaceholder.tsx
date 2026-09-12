import { ClayPanel } from '@/components/clay/ClayPanel';
import { EditorSkeleton } from '@/components/editor/VimEditorLoader';

export function ExercisePlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-testid="exercise-placeholder"
      className={`flex flex-col gap-4 ${className}`.trim()}
    >
      <ClayPanel hue="violet" className="flex min-h-[12rem] flex-col gap-4 px-6 py-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="block h-3 w-28 rounded-full bg-[var(--clay-sunken)] opacity-70" />
          <span className="block h-3 w-16 rounded-full bg-[var(--clay-sunken)] opacity-50" />
        </div>
        <span className="block h-3 w-4/5 rounded-full bg-[var(--clay-sunken)] opacity-60" />
        <span className="block h-3 w-3/5 rounded-full bg-[var(--clay-sunken)] opacity-40" />
      </ClayPanel>
      <EditorSkeleton />
    </div>
  );
}
