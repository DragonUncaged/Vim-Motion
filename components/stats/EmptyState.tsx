import Link from 'next/link';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { ClayButton } from '@/components/clay/ClayButton';
import { KeyRun } from '@/components/clay/Key';

export function EmptyState({ storageOk = true }: { storageOk?: boolean }) {
  return (
    <ClayPanel hue="butter" tint size="hero" className="flex flex-col gap-4 px-7 py-7">
      <div className="flex items-center gap-3">
        <KeyRun keys={['d', 'w']} live={false} hue="butter" />
      </div>

      <h2 className="m-0 text-2xl">
        {storageOk ? 'Nothing recorded yet' : 'Nothing can be recorded here'}
      </h2>

      <p className="clay-prose m-0 text-base">
        {storageOk
          ? 'Solve one exercise and this fills in: speed, accuracy, and a mastery score for ' +
            'every motion you use.'
          : 'This browser is refusing to store data for this site, so nothing you finish is ' +
            'kept and this page cannot fill in.'}
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <ClayButton intent="primary" asChild>
          <Link href="/learn">Start with the first lesson</Link>
        </ClayButton>
      </div>
    </ClayPanel>
  );
}
