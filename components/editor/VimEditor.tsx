'use client';

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { Compartment, EditorState, Prec } from '@codemirror/state';
import { history, historyKeymap, indentLess, indentMore } from '@codemirror/commands';
import { bracketMatching, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { getCM, vim } from '@replit/codemirror-vim';

import { Key } from '@/components/clay/Key';
import type { EditorMode, LessonLanguage, Pos } from '@/content/types';
import type { VimEditorProps } from '@/lib/engine/types';
import { configureVimGlobals, createVimBridge, type PendingCommand } from '@/lib/engine/vim-bridge';
import {
  FullScreenPlaceholder,
  FullScreenScrim,
  FullScreenToggle,
  useEditorFullScreen,
} from './fullScreen';
import { cachedLanguage, loadLanguage } from './languages';
import { MODE_FAMILY, MODE_HUE, MODE_LABEL } from './mode';
import { clayEditorTheme, clayHighlightStyle } from './theme';

const FILENAME: Record<LessonLanguage, string> = {
  text: 'buffer',
  tsx: 'component.tsx',
  go: 'main.go',
  cpp: 'main.cpp',
};

const KEYLOG_LENGTH = 12;

const WELL_LINE_REM = 0.9375 * 1.75;
const WELL_PADDING_REM = 2;
const WELL_MIN_REM = 9;
const WELL_MAX_REM = 26 + WELL_PADDING_REM;

export function wellHeightFor(doc: string): string {
  const lines = doc.split('\n').length;
  const natural = lines * WELL_LINE_REM + WELL_PADDING_REM;
  return `${Math.min(WELL_MAX_REM, Math.max(WELL_MIN_REM, natural))}rem`;
}

export type { VimEditorProps };

function VimEditor({
  doc,
  language,
  initialCursor,
  setupKeys,
  autoFocus = false,
  onSnapshot,
  onKeystroke,
  className = '',
  onReady,
  onModeChange,
  onReleaseFocus,
  onFocusChange,
  footer,
  resultBar,
  onFullScreenChange,
  title,
  showFocusOverlay = true,
  allowFullScreen = false,
}: VimEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const fullScreenButtonRef = useRef<HTMLButtonElement | null>(null);
  const expandedRef = useRef(false);
  const viewRef = useRef<EditorView | null>(null);
  const [mode, setMode] = useState<EditorMode>('normal');
  const [pending, setPending] = useState<PendingCommand | null>(null);
  const [focused, setFocused] = useState(false);
  const [keyLog, setKeyLog] = useState<{ id: number; key: string }[]>([]);
  const [cursor, setCursor] = useState<Pos>({ line: 0, ch: 0 });
  const overlayId = useId();

  // Refs, not deps: re-creating the EditorView drops focus, the cursor and the undo history.
  const cbRef = useRef({
    onSnapshot,
    onKeystroke,
    onReady,
    onModeChange,
    onReleaseFocus,
    onFocusChange,
    onFullScreenChange,
  });
  cbRef.current = {
    onSnapshot,
    onKeystroke,
    onReady,
    onModeChange,
    onReleaseFocus,
    onFocusChange,
    onFullScreenChange,
  };

  // Read once at mount; later changes go through bridge.reset().
  const initialRef = useRef({ initialCursor, setupKeys });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    configureVimGlobals();

    host.replaceChildren();

    /* Tab stays free in normal mode as a way out; Ctrl+j/k belong on the page's window listener. */
    const tabKeys = Prec.highest(
      keymap.of([
        {
          key: 'Tab',
          run: (v) => (getCM(v)?.state.vim?.insertMode ? indentMore(v) : false),
          shift: (v) => (getCM(v)?.state.vim?.insertMode ? indentLess(v) : false),
        },
      ]),
    );

    const languageMode = new Compartment();
    const initialMode = cachedLanguage(language) ?? [];

    const view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc,
        extensions: [
          vim(),
          // Without this facet Ctrl+v silently collapses to one line.
          EditorState.allowMultipleSelections.of(true),
          tabKeys,
          lineNumbers(),
          // A long group delay so `u` undoes a whole insert, as vim does.
          history({ newGroupDelay: 2000 }),
          drawSelection(),
          highlightActiveLine(),
          bracketMatching(),
          indentOnInput(),
          syntaxHighlighting(clayHighlightStyle, { fallback: true }),
          languageMode.of(initialMode),
          clayEditorTheme,
          keymap.of(historyKeymap),
          EditorView.contentAttributes.of({
            'aria-label': `${title ?? FILENAME[language]} — vim editor. Escape twice leaves it.`,
          }),
        ],
      }),
    });
    viewRef.current = view;

    let keyId = 0;
    const bridge = createVimBridge(view, {
      onModeChange: (m) => {
        setMode(m);
        cbRef.current.onModeChange?.(m);
      },
      onPendingChange: (p) => setPending(p),
      onKeystroke: (record, snap) => {
        keyId += 1;
        const id = keyId;
        setKeyLog((log) => [...log, { id, key: record.key }].slice(-KEYLOG_LENGTH));
        cbRef.current.onKeystroke?.(record.key, snap, record.at);
      },
      onAttemptReset: () => setKeyLog([]),
      onSnapshot: (snap) => {
        setCursor(snap.cursor);
        cbRef.current.onSnapshot?.(snap);
      },
      onEscapeHatch: () => {
        if (expandedRef.current) {
          fullScreenButtonRef.current?.focus();
          return;
        }
        cbRef.current.onReleaseFocus?.();
      },
    });

    /* Not viewRef.current: under StrictMode a late resolve would dispatch into the second mount's view. */
    let destroyed = false;

    /* Focus within view.dom, not contentDOM: vim's / ? : prompt is an <input> inside it. */
    let hasFocus = false;
    const reportFocus = (next: boolean) => {
      if (next === hasFocus) return;
      hasFocus = next;
      setFocused(next);
      cbRef.current.onFocusChange?.(next);
    };
    const onFocusIn = () => reportFocus(true);
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget;
      if (next instanceof Node && view.dom.contains(next)) return;
      window.setTimeout(() => {
        if (destroyed) return;
        reportFocus(view.dom.contains(document.activeElement));
      }, 0);
    };
    view.dom.addEventListener('focusin', onFocusIn);
    view.dom.addEventListener('focusout', onFocusOut);

    if (cachedLanguage(language) === null) {
      void loadLanguage(language).then((extension) => {
        if (destroyed || !extension) return;
        view.dispatch({ effects: languageMode.reconfigure(extension) });
      });
    }

    const { initialCursor: startCursor, setupKeys: startKeys } = initialRef.current;
    // Programmatic, never synthetic KeyboardEvents, so setup keys are not counted.
    bridge.reset({ doc, cursor: startCursor, setupKeys: startKeys });
    setKeyLog([]);
    setMode(bridge.mode());
    if (autoFocus) bridge.focus();
    cbRef.current.onReady?.(bridge);

    return () => {
      destroyed = true;
      view.dom.removeEventListener('focusin', onFocusIn);
      view.dom.removeEventListener('focusout', onFocusOut);
      // A destroyed view fires no focusout, so report it here or the clock keeps running.
      if (hasFocus) cbRef.current.onFocusChange?.(false);
      bridge.destroy();
      view.destroy();
      viewRef.current = null;
    };
    // `doc` and `language` are the initial state of a whole editor: changing either is a
    // new lesson, and a remount is correct. Everything else is deliberately excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, language]);

  const focus = useCallback(() => viewRef.current?.focus(), []);

  const fullScreen = useEditorFullScreen(frameRef);
  const expanded = allowFullScreen && fullScreen.on;
  expandedRef.current = expanded;

  useEffect(() => {
    if (expanded) viewRef.current?.focus();
  }, [expanded]);

  useEffect(() => {
    cbRef.current.onFullScreenChange?.(expanded);
  }, [expanded]);

  const family = MODE_FAMILY[mode];
  const hue = MODE_HUE[mode];

  /* Set here: --clay-hue-edge on :root resolves to violet, and .hue-coral loses to .clay-editor. */
  const modeStyle = useMemo(() => {
    const vars: Record<string, string> = {
      '--clay-hue-edge': 'color-mix(in oklab, var(--clay-hue-ink) 35%, var(--clay-hue))',
    };
    if (family === 'replace') {
      vars['--clay-hue'] = 'var(--clay-coral)';
      vars['--clay-hue-ink'] = 'var(--clay-coral-ink)';
    }
    /* .clay-hero's two tokens inline: the class loses to .clay-editor at equal specificity. */
    if (expanded) {
      vars.borderRadius = 'var(--r-hero)';
      vars.boxShadow = 'var(--clay-shadow-hero)';
      vars['--vc-editor-max-height'] = 'none';
    }
    return vars;
  }, [family, expanded]);
  const countText = pending?.count != null ? String(pending.count) : '';
  const pendingText = pending?.display ?? '';

  const keycaps = useMemo(
    () => keyLog.map((entry, i) => ({ ...entry, latest: i === keyLog.length - 1 })),
    [keyLog],
  );

  // From the prop: the live document must not resize the frame.
  const wellHeight = useMemo(() => wellHeightFor(doc), [doc]);

  const label = title ?? FILENAME[language];

  return (
    <>
      {expanded && <FullScreenPlaceholder height={fullScreen.heldHeight} />}
      {expanded && <FullScreenScrim />}

      <div
        ref={frameRef}
        className={['clay-editor', expanded ? 'fixed inset-6 z-50 flex flex-col' : '', className]
          .filter(Boolean)
          .join(' ')}
        data-mode={family}
        data-testid="vim-editor"
        data-fullscreen={expanded ? 'true' : undefined}
        /* Not aria-modal: it would hide each surface's polite live region outside the frame. */
        role={expanded ? 'dialog' : undefined}
        aria-label={expanded ? `${label} — full screen editor` : undefined}
        style={modeStyle}
      >
        <div className="clay-editor-title">
          <span aria-hidden="true">●</span>
          <span>{label}</span>
          <span className="clay-status-right items-center gap-1.5 normal-case">
            <Key label="Esc" size="sm" hue={hue} live={false} />
            <Key label="Esc" size="sm" hue={hue} live={false} />
            {expanded && <Key label="Enter" size="sm" hue={hue} live={false} />}
            <span className="font-sans text-[0.6875rem] font-semibold">
              {expanded ? 'leaves full screen' : 'leaves the editor'}
            </span>
            {allowFullScreen && (
              <FullScreenToggle
                ref={fullScreenButtonRef}
                on={fullScreen.on}
                onToggle={fullScreen.toggle}
                hue={hue}
              />
            )}
          </span>
        </div>

        <div className={expanded ? 'relative min-h-0 flex-1' : 'relative'}>
          <div
            className="clay-editor-well"
            style={{ height: expanded ? '100%' : wellHeight }}
            ref={hostRef}
          />

          {!focused && showFocusOverlay && (
            <button
              type="button"
              id={overlayId}
              onClick={focus}
              data-testid="focus-overlay"
              className="clay clay-card hue-violet clay-press absolute inset-2 z-10 flex cursor-pointer flex-col items-center justify-center gap-1 border-0 text-center"
            >
              <span className="font-display text-base font-semibold">Click to focus</span>
              <span className="clay-secondary text-xs">or press Enter</span>
            </button>
          )}
        </div>

        <div className="clay-status" data-testid="vim-status-bar">
          <span className="clay-status-mode" data-testid="vim-mode-label">
            -- {MODE_LABEL[mode]} --
          </span>
          <span className="clay-status-file">{label}</span>
          <span className="clay-status-right">
            {countText !== '' && (
              <span data-testid="vim-count" title="count">
                {countText}
              </span>
            )}
            <span className="clay-status-pending" data-testid="vim-pending">
              {pendingText}
            </span>
            <span>
              {cursor.line + 1}:{cursor.ch + 1}
            </span>
          </span>
        </div>

        {/* Mounted while expanded: a status region that arrives already full is not reliably announced. */}
        {expanded && (
          <div
            className={resultBar == null ? '' : 'px-3 pb-3'}
            data-testid="expanded-outcome"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {resultBar}
          </div>
        )}

        {/* aria-hidden: a screen reader already echoes typed keys. */}
        {!(expanded && resultBar != null) && (
          <div
            className="flex h-[2.875rem] flex-nowrap items-center gap-1 overflow-hidden px-3 py-2"
            aria-hidden="true"
            data-testid="keystroke-log"
          >
            {keycaps.length === 0 ? (
              <span className="clay-secondary px-1 text-xs">Your keys show up here.</span>
            ) : (
              keycaps.map(({ id, key, latest }) => (
                <Key
                  key={id}
                  label={key}
                  size="sm"
                  hue={hue}
                  live={false}
                  pressed={latest}
                  className={latest ? '' : 'opacity-70'}
                />
              ))
            )}
          </div>
        )}

        {footer}
      </div>
    </>
  );
}

/** Memoised: keep every prop referentially stable (no inline object or footer). */
export default memo(VimEditor);
