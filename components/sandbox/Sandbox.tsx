'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';

import { ClayButton } from '@/components/clay/ClayButton';
import { ClayPanel } from '@/components/clay/ClayPanel';
import { Key } from '@/components/clay/Key';
import VimEditorLoader, { EditorSkeleton } from '@/components/editor/VimEditorLoader';
import { useIsWideScreen } from '@/components/hooks/useIsWideScreen';
import type { LessonLanguage } from '@/content/types';
import type { EditorMode, EditorSnapshot, VimBridge } from '@/lib/engine';
import { HelpPanel } from './HelpPanel';
import {
  CUSTOM_ID,
  DEFAULT_PREFS,
  LANGUAGES,
  MAX_CUSTOM,
  SAMPLES,
  languageFromFilename,
  loadPrefs,
  prefsWritable,
  sampleById,
  savePrefs,
  truncateCustom,
  type SandboxPrefs,
} from './samples';

export function Sandbox() {
  const wide = useIsWideScreen();

  const [prefs, setPrefs] = useState<SandboxPrefs>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    setPrefs(loadPrefs());
    setHydrated(true);
    if (!prefsWritable()) {
      setNotice('This browser will not let the page store anything, so nothing here is kept.');
    }
  }, []);

  const [mode, setMode] = useState<EditorMode>('normal');
  const [pendingKeys, setPendingKeys] = useState('');
  const [pasting, setPasting] = useState(false);
  const [draft, setDraft] = useState('');

  const bridgeRef = useRef<VimBridge | null>(null);
  const chromeRef = useRef<HTMLDivElement | null>(null);
  const pasteRef = useRef<HTMLTextAreaElement | null>(null);

  const sample = sampleById(prefs.sampleId);
  const isCustom = prefs.sampleId === CUSTOM_ID;
  const doc = isCustom ? prefs.custom : (sample?.doc ?? SAMPLES[0]?.doc ?? '');
  const language = isCustom ? prefs.language : (sample?.language ?? 'text');
  const filename = isCustom
    ? prefs.customName === ''
      ? 'your-file'
      : prefs.customName
    : (sample?.filename ?? 'buffer');

  const remember = useCallback((next: SandboxPrefs) => {
    setPrefs(next);
    return savePrefs(next);
  }, []);

  const onSnapshot = useCallback((s: EditorSnapshot) => {
    setMode(s.mode);
    setPendingKeys(s.pendingKeys);
  }, []);

  const onReady = useCallback((bridge: VimBridge) => {
    bridgeRef.current = bridge;
  }, []);

  // Through the bridge, not a remount, so focus and the key log survive.
  const reset = useCallback(() => {
    const bridge = bridgeRef.current;
    if (bridge === null) return;
    bridge.reset({ doc });
    bridge.focus();
  }, [doc]);

  const chooseSample = useCallback(
    (id: string) => {
      const next = sampleById(id);
      if (next === undefined) return;
      setNotice('');
      remember({ ...prefs, sampleId: id, language: next.language });
    },
    [prefs, remember],
  );

  const openPaste = useCallback(() => {
    setDraft(prefs.custom);
    setPasting(true);
  }, [prefs.custom]);

  useEffect(() => {
    if (pasting) pasteRef.current?.focus();
  }, [pasting]);

  const load = useCallback(
    (raw: string, lang: LessonLanguage, customName: string) => {
      const { text, truncated } = truncateCustom(raw.replace(/\r\n/g, '\n'));
      if (text.trim() === '') return;
      const stored = remember({ sampleId: CUSTOM_ID, language: lang, custom: text, customName });
      const cap = MAX_CUSTOM.toLocaleString('en');
      setNotice(
        truncated
          ? `Longer than ${cap} characters, so the first ${cap} were loaded.`
          : stored
            ? ''
            : 'This browser will not let the page store anything, so this is gone on reload.',
      );
      setPasting(false);
    },
    [remember],
  );

  const usePasted = useCallback(() => {
    load(draft, prefs.language, '');
  }, [draft, load, prefs.language]);

  const openFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (file === undefined) return;
      const reader = new FileReader();
      reader.onload = () => {
        load(
          typeof reader.result === 'string' ? reader.result : '',
          languageFromFilename(file.name),
          file.name,
        );
      };
      reader.onerror = () => setNotice('That file could not be read.');
      reader.readAsText(file);
    },
    [load],
  );

  const chooseLanguage = useCallback(
    (id: LessonLanguage) => {
      remember({
        ...prefs,
        sampleId: prefs.custom === '' ? prefs.sampleId : CUSTOM_ID,
        language: id,
      });
    },
    [prefs, remember],
  );

  const editor = (
    <VimEditorLoader
      key={`${prefs.sampleId}:${language}:${doc.length}`}
      doc={doc}
      language={language}
      title={filename}
      autoFocus={false}
      onSnapshot={onSnapshot}
      onModeChange={setMode}
      onReady={onReady}
      onReleaseFocus={() => chromeRef.current?.focus()}
      allowFullScreen
    />
  );

  return (
    <div className="flex flex-col gap-6 pt-4">
      <header className="flex flex-col gap-2">
        <h1 className="m-0">Sandbox</h1>
        <p className="clay-prose m-0 text-lg">A real vim buffer with nothing to solve.</p>
      </header>

      {/* !== false on purpose: the undecided frame is every laptop's first paint. */}
      {wide !== false && (
        <div
          ref={chromeRef}
          tabIndex={-1}
          className="rounded-[var(--r-card)] outline-none focus-visible:outline-[length:var(--clay-focus-width)] focus-visible:outline-[var(--clay-focus)]"
        >
          <ClayPanel hue="violet" className="flex flex-col gap-3 px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              {SAMPLES.map((s) => (
                <ClayButton
                  key={s.id}
                  intent={prefs.sampleId === s.id ? 'primary' : 'secondary'}
                  aria-pressed={prefs.sampleId === s.id}
                  onClick={() => chooseSample(s.id)}
                >
                  {s.label}
                </ClayButton>
              ))}
              <ClayButton
                intent={isCustom ? 'primary' : 'ghost'}
                aria-pressed={isCustom}
                onClick={openPaste}
                data-testid="sandbox-own"
              >
                Your own file
              </ClayButton>
              <span className="ml-auto flex flex-wrap items-center gap-2">
                <ClayButton intent="ghost" onClick={reset} disabled={!hydrated}>
                  Reset to {isCustom ? 'your own file' : 'the sample'}
                </ClayButton>
              </span>
            </div>

            {notice !== '' && (
              <p
                className="clay-secondary m-0 text-[0.8125rem]"
                role="status"
                data-testid="sandbox-notice"
              >
                {notice}
              </p>
            )}
          </ClayPanel>
        </div>
      )}

      {wide !== false && pasting && (
        <ClayPanel hue="butter" className="flex flex-col gap-3 px-5 py-4">
          <label className="flex flex-col gap-2" htmlFor="sandbox-paste">
            <span className="font-display text-base font-semibold">Your own file</span>
            <textarea
              id="sandbox-paste"
              ref={pasteRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={10}
              spellCheck={false}
              placeholder="Paste here…"
              className="clay-well hue-butter w-full resize-y rounded-[var(--r-chip)] p-3 font-mono text-[0.8125rem] leading-relaxed text-[var(--clay-ink)] outline-none focus-visible:outline-[length:var(--clay-focus-width)] focus-visible:outline-[var(--clay-focus)]"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <ClayButton
              intent="primary"
              hue="mint"
              onClick={usePasted}
              disabled={draft.trim() === ''}
            >
              Load it into the editor
            </ClayButton>
            <ClayButton intent="secondary" asChild>
              <label htmlFor="sandbox-file">Open a file…</label>
            </ClayButton>
            <input
              id="sandbox-file"
              type="file"
              className="sr-only"
              onChange={openFile}
              data-testid="sandbox-file"
            />
            <ClayButton intent="ghost" onClick={() => setPasting(false)}>
              Cancel
            </ClayButton>
          </div>
          <fieldset className="m-0 flex flex-wrap items-center gap-2 border-0 p-0">
            <legend className="sr-only">Highlighting</legend>
            <span className="clay-secondary text-[0.8125rem]">Highlight as</span>
            {LANGUAGES.map((l) => (
              <ClayButton
                key={l.id}
                intent={prefs.language === l.id ? 'primary' : 'secondary'}
                hue="butter"
                aria-pressed={prefs.language === l.id}
                onClick={() => chooseLanguage(l.id)}
              >
                {l.label}
              </ClayButton>
            ))}
          </fieldset>
        </ClayPanel>
      )}

      {wide === null ? (
        <div aria-hidden="true">
          <EditorSkeleton />
        </div>
      ) : wide ? (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_25rem]">
          <div className="flex min-w-0 flex-col gap-4">
            {editor}
            <p className="clay-secondary m-0 flex flex-wrap items-center gap-1.5 text-[0.8125rem]">
              <Key label="u" size="sm" hue="blue" />
              <span>undoes,</span>
              <Key label="C-r" size="sm" hue="blue" />
              <span>redoes, and</span>
              <Key label="Esc" size="sm" hue="blue" />
              <Key label="Esc" size="sm" hue="blue" />
              <span>hands the keyboard back to the page.</span>
            </p>
            <p className="clay-secondary m-0 text-[0.8125rem]">
              On Windows and Linux <code>Ctrl+W</code> closes the tab before the page can see it.
              Use <code>Ctrl+Backspace</code> or <code>db</code> to rub out a word.
            </p>
          </div>
          <HelpPanel
            mode={mode}
            pendingKeys={pendingKeys}
            className="lg:sticky lg:top-5 lg:max-h-[calc(100dvh-2.5rem)] lg:overflow-y-auto"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <ClayPanel hue="butter" tint className="px-6 py-6">
            <div className="mb-4 flex items-center gap-2">
              <Key label="h" hue="butter" size="sm" live={false} />
              <Key label="j" hue="butter" size="sm" live={false} />
              <Key label="k" hue="butter" size="sm" live={false} />
              <Key label="l" hue="butter" size="sm" live={false} />
            </div>
            <h2 className="m-0 text-xl">The editor needs a keyboard</h2>
            <p className="clay-prose mt-2 text-base">
              Come back on a laptop and this becomes a real editor.
            </p>
          </ClayPanel>
          <HelpPanel mode="normal" pendingKeys="" live={false} />
        </div>
      )}
    </div>
  );
}
