'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ClayButton } from '@/components/clay/ClayButton';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { clearProgress, exportFilename, exportProgress, loadProgress } from '@/lib/progress';

/** Never format stored attempts: the page that sent the learner here may have died doing exactly that. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [stored, setStored] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    setStored(loadProgress().attempts.length);
  }, [error]);

  function exportStored() {
    try {
      const json = exportProgress();
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = exportFilename();
      anchor.click();
      URL.revokeObjectURL(url);
      setNote(`Saved ${exportFilename()}. Import it from the stats page later.`);
    } catch {
      setNote('The export could not be written. Your stored progress is untouched.');
    }
  }

  function clearStored() {
    setConfirming(false);
    const cleared = clearProgress();
    setNote(
      cleared
        ? 'Stored progress cleared. Trying the page again.'
        : 'This browser would not let the page clear its storage.',
    );
    setStored(cleared ? 0 : stored);
    if (cleared) reset();
  }

  const attempts =
    stored === null
      ? 'what is stored'
      : `${stored} stored ${stored === 1 ? 'attempt' : 'attempts'}`;

  return (
    <div className="flex flex-col gap-6 pt-4">
      <header className="flex flex-col gap-3">
        <p className="clay-secondary m-0 text-sm">Something broke</p>
        <h1 className="m-0">This page hit an error</h1>
      </header>

      <ClayPanel hue="coral" className="flex flex-col gap-4 px-7 py-6">
        <p className="clay-prose m-0 text-base">
          The page threw while rendering and stopped. Nothing was sent anywhere, so what is below is
          the whole report.
        </p>
        <ClayPanel
          sunken
          size="chip"
          hue="coral"
          className="flex flex-col gap-1 px-5 py-4 font-mono text-sm"
          aria-label="Error details"
        >
          <p className="m-0 break-words">{error.message || String(error) || 'Unknown error'}</p>
          {error.digest && <p className="clay-secondary m-0">digest {error.digest}</p>}
        </ClayPanel>
        <div className="flex flex-wrap items-center gap-3">
          <ClayButton intent="primary" onClick={() => reset()}>
            Try again
          </ClayButton>
          <ClayButton asChild intent="secondary">
            <Link href="/learn">Go to the lessons</Link>
          </ClayButton>
          <ClayButton asChild intent="ghost">
            <Link href="/">Back to the start</Link>
          </ClayButton>
        </div>
      </ClayPanel>

      <ClayPanel hue="butter" className="flex flex-col gap-4 px-7 py-6">
        <div className="flex flex-col gap-2">
          <h2 className="m-0 text-xl">If it keeps happening</h2>
          <p className="clay-prose m-0 text-base">
            A page that breaks every visit is usually choking on the progress stored here. Export
            it, clear it, and try again — the file imports back from the stats page.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ClayButton intent="secondary" onClick={exportStored} disabled={stored === 0}>
            Export what is stored
          </ClayButton>
          <ClayButton
            intent="danger"
            onClick={() => setConfirming(true)}
            disabled={stored === 0 || confirming}
          >
            Clear stored progress
          </ClayButton>
        </div>

        {confirming && (
          <ClayPanel hue="butter" tint size="chip" className="flex flex-col gap-3 px-5 py-4">
            <p className="m-0 text-base">
              This deletes {attempts}. Only the file you export can bring them back. Clear it?
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <ClayButton intent="danger" onClick={clearStored}>
                Yes, clear it
              </ClayButton>
              <ClayButton intent="ghost" onClick={() => setConfirming(false)}>
                Keep it
              </ClayButton>
            </div>
          </ClayPanel>
        )}

        <p aria-live="polite" className="clay-secondary m-0 text-sm">
          {note}
        </p>
      </ClayPanel>
    </div>
  );
}
