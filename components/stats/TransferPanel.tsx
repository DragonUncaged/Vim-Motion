'use client';

import { useRef, useState } from 'react';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { ClayButton } from '@/components/clay/ClayButton';
import {
  MAX_ATTEMPTS,
  clearProgress,
  exportFilename,
  exportProgress,
  importProgress,
  loadProgress,
  parseProgressBlob,
  saveProgress,
  type ImportResult,
} from '@/lib/progress';
import { count, plural } from '@/lib/stats/format';

/** docs/CONTRACT.md §6. */

type Status =
  { kind: 'idle' } | { kind: 'ok'; message: string } | { kind: 'error'; message: string };

export function TransferPanel({
  attempts,
  storageOk = true,
}: {
  attempts: number;
  storageOk?: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [pending, setPending] = useState<{ json: string; incoming: number } | null>(null);
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState('');

  function download() {
    const json = exportProgress();
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = exportFilename();
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus({
      kind: 'ok',
      message: `Saved ${exportFilename()} with ${plural(attempts, 'attempt')} in it.`,
    });
  }

  function countAttempts(json: string): number | null {
    try {
      return parseProgressBlob(JSON.parse(json))?.attempts.length ?? null;
    } catch {
      return null;
    }
  }

  function offer(json: string) {
    setStatus({ kind: 'idle' });
    const incoming = countAttempts(json);
    if (incoming === null || incoming === 0 || attempts === 0) {
      report(importProgress(json), 'merge');
      return;
    }
    setPending({ json, incoming });
  }

  function report(result: ImportResult, mode: 'merge' | 'replace') {
    setPending(null);
    setPasted('');
    setPasting(false);
    if (!result.ok) {
      setStatus({ kind: 'error', message: result.error });
      return;
    }
    // Read back from the store: saveProgress silently trims to MAX_ATTEMPTS.
    const held = loadProgress().attempts.length;
    const trimmed = mode === 'merge' && held < attempts + result.merged;
    setStatus({
      kind: 'ok',
      message:
        mode === 'replace'
          ? `Replaced what was here with ${plural(result.merged, 'attempt')} from that file.`
          : `Read ${plural(result.imported, 'attempt')}, ${result.merged} of them new. ` +
            `This browser now holds ${plural(held, 'attempt')}.` +
            (trimmed
              ? ` The oldest were dropped to keep the store at ${count(MAX_ATTEMPTS)}.`
              : ''),
    });
  }

  function merge() {
    if (pending === null) return;
    report(importProgress(pending.json), 'merge');
  }

  function replace() {
    if (pending === null) return;
    if (countAttempts(pending.json) === null) {
      report(importProgress(pending.json), 'replace');
      return;
    }
    const before = loadProgress();
    clearProgress();
    const result = importProgress(pending.json);
    if (!result.ok) saveProgress(before);
    report(result, 'replace');
  }

  async function onFile(file: File | undefined) {
    if (file === undefined) return;
    try {
      offer(await file.text());
    } catch {
      setStatus({
        kind: 'error',
        message: 'That file could not be read. Try exporting it again, or paste it in below.',
      });
    }
  }

  return (
    <ClayPanel hue="violet" size="hero" className="flex flex-col gap-4 px-7 py-6">
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-xl">Take your progress with you</h2>
        <p className="clay-prose m-0 text-base">
          Your practice lives in this browser. Export it and import the file on any other machine.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ClayButton intent="primary" onClick={download} disabled={attempts === 0}>
          Export progress (JSON)
        </ClayButton>
        <ClayButton intent="secondary" onClick={() => fileInput.current?.click()}>
          Import progress
        </ClayButton>
        <ClayButton intent="ghost" onClick={() => setPasting((v) => !v)}>
          {pasting ? 'Hide the paste box' : 'Paste it instead'}
        </ClayButton>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          tabIndex={-1}
          aria-hidden="true"
          className="clay-sr-only"
          onChange={(event) => {
            void onFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </div>

      {attempts === 0 && (
        <p className="clay-secondary m-0 text-sm">
          {storageOk
            ? 'Nothing to export yet. Importing works right away.'
            : 'Nothing to export — this browser is not storing attempts, so an imported file ' +
              'would not be kept either.'}
        </p>
      )}

      {pasting && (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-2 text-sm">
            Paste the contents of an exported file
            <textarea
              value={pasted}
              onChange={(event) => setPasted(event.target.value)}
              rows={5}
              spellCheck={false}
              placeholder='{"app":"vim-clay","version":1,...}'
              className="clay-well clay-chip clay-focusable font-mono resize-y px-4 py-3 text-xs"
            />
          </label>
          <div>
            <ClayButton
              intent="secondary"
              onClick={() => offer(pasted)}
              disabled={pasted.trim() === ''}
            >
              Read what I pasted
            </ClayButton>
          </div>
        </div>
      )}

      {pending !== null && (
        <ClayPanel hue="butter" tint size="chip" className="flex flex-col gap-3 px-5 py-4">
          <p className="m-0 text-base">
            That file holds {plural(pending.incoming, 'attempt')}, and this browser already has{' '}
            {plural(attempts, 'attempt')}. What would you like to do?
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ClayButton intent="primary" onClick={merge}>
              Merge them
            </ClayButton>
            <ClayButton intent="danger" onClick={replace}>
              Replace what is here
            </ClayButton>
            <ClayButton intent="ghost" onClick={() => setPending(null)}>
              Cancel
            </ClayButton>
          </div>
          <p className="clay-secondary m-0 text-sm">
            Merging keeps both histories and skips anything already stored, so importing the same
            file twice changes nothing. Replacing throws away what is in this browser.
          </p>
        </ClayPanel>
      )}

      <p
        aria-live="polite"
        className={`m-0 text-sm ${status.kind === 'error' ? 'font-semibold' : 'clay-secondary'}`}
        style={status.kind === 'error' ? { color: 'var(--clay-coral-ink)' } : undefined}
      >
        {status.kind === 'idle' ? '' : status.message}
      </p>
    </ClayPanel>
  );
}
