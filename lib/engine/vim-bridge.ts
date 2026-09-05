/** Never value-import this from a page component: it pulls ~240 kB of @replit/codemirror-vim into the route. */

import type { EditorView } from '@codemirror/view';
import type { Text } from '@codemirror/state';
import { deleteCharBackward, indentLess, indentMore, undoDepth } from '@codemirror/commands';
import { Vim, getCM } from '@replit/codemirror-vim';

import type { EditorMode, Pos } from '@/content/types';
import type { EditorSnapshot, KeystrokeRecord, SnapshotSelection } from './types';

/** Never call Vim.unmap(): it breaks every keyToKey expansion (s, S, arrows, <CR>, ...). Vim.noremap() and Vim.mapCommand() are safe. */
export function configureVimGlobals(): void {}

export function offsetToPos(doc: Text, offset: number): Pos {
  const off = Math.max(0, Math.min(doc.length, offset));
  const line = doc.lineAt(off);
  return { line: line.number - 1, ch: off - line.from };
}

export function posToOffset(doc: Text, pos: Pos): number {
  const lineNo = Math.max(1, Math.min(doc.lines, pos.line + 1));
  const line = doc.line(lineNo);
  return Math.max(line.from, Math.min(line.to, line.from + Math.max(0, pos.ch)));
}

interface VimModeChangeEvent {
  mode: string;
  subMode?: string;
}

export function normalizeMode(e: VimModeChangeEvent): EditorMode {
  switch (e.mode) {
    case 'insert':
      return 'insert';
    case 'replace':
      return 'replace';
    case 'visual':
      // subMode is '' (not undefined) for characterwise visual.
      if (e.subMode === 'linewise') return 'visual-line';
      if (e.subMode === 'blockwise') return 'visual-block';
      return 'visual';
    default:
      return 'normal';
  }
}

export function readMode(view: EditorView): EditorMode {
  const cm = getCM(view);
  const vim = cm?.state.vim;
  if (!cm || !vim) return 'normal';
  if (vim.insertMode) return cm.state.overwrite ? 'replace' : 'insert';
  if (vim.visualMode) {
    if (vim.visualBlock) return 'visual-block';
    if (vim.visualLine) return 'visual-line';
    return 'visual';
  }
  return 'normal';
}

export interface PendingCommand {
  keys: string;
  count: number | null;
  /** vim's INTERNAL operator name — 'delete', not 'd'. Never show this to a learner. */
  operator: string | null;
  register: string | null;
  keyBuffer: string[];
  display: string;
  active: boolean;
}

const EMPTY_PENDING: PendingCommand = {
  keys: '',
  count: null,
  operator: null,
  register: null,
  keyBuffer: [],
  display: '',
  active: false,
};

export function readPending(view: EditorView): PendingCommand {
  const vs = getCM(view)?.state.vim;
  const input = vs?.inputState;
  if (!vs || !input) return EMPTY_PENDING;

  // vim.status is the only place the typed keys survive; inputState.operator holds vim's name ('delete').
  const keys = vs.status ?? '';
  const digits = [...(input.prefixRepeat ?? []), ...(input.motionRepeat ?? [])].join('');
  // `"a` clears vim.status while registerName stays set, so the prefix is re-attached.
  const register = input.registerName ?? null;
  const display = (register ? `"${register}` : '') + keys;

  return {
    keys,
    count: digits.length ? parseInt(digits, 10) : null,
    operator: input.operator ?? null,
    register,
    keyBuffer: [...(input.keyBuffer ?? [])],
    display,
    active: display.length > 0,
  };
}

export function readCursor(view: EditorView): Pos {
  return offsetToPos(view.state.doc, view.state.selection.main.head);
}

/** Visual-block: state.selection holds one range on the cursor's line; the corners live on cm.state.vim.sel. */
export function readSelection(view: EditorView): SnapshotSelection | null {
  const cm = getCM(view);
  const vs = cm?.state.vim;

  if (vs?.visualMode && vs.visualBlock && vs.sel) {
    const a = vs.sel.anchor;
    const h = vs.sel.head;
    const topLine = Math.min(a.line, h.line);
    const bottomLine = Math.max(a.line, h.line);
    const leftCh = Math.min(a.ch, h.ch);
    const rightCh = Math.max(a.ch, h.ch) + 1; // vim blocks are inclusive
    return {
      from: { line: topLine, ch: leftCh },
      to: { line: bottomLine, ch: rightCh },
      block: { topLine, bottomLine, leftCh, rightCh },
    };
  }

  const r = view.state.selection.main;
  if (r.empty) return null;
  return {
    from: offsetToPos(view.state.doc, r.from),
    to: offsetToPos(view.state.doc, r.to),
  };
}

export interface RegisterValue {
  text: string;
  linewise: boolean;
  blockwise: boolean;
}

export function readRegister(name: string): RegisterValue {
  const rc = Vim.getRegisterController();
  const reg = name === '"' || name === '' ? rc.unnamedRegister : rc.getRegister(name);
  return {
    text: reg ? reg.toString() : '',
    linewise: reg ? !!reg.linewise : false,
    blockwise: reg ? !!reg.blockwise : false,
  };
}

const REGISTER_NAMES = '"abcdefghijklmnopqrstuvwxyz0123456789-'.split('');

function readRegisters(): Record<string, string> {
  const out: Record<string, string> = {};
  const rc = Vim.getRegisterController();
  out['"'] = rc.unnamedRegister ? rc.unnamedRegister.toString() : '';
  for (const n of REGISTER_NAMES) {
    if (n === '"') continue;
    const r = rc.registers[n];
    if (r) out[n] = r.toString();
  }
  return out;
}

function registerFingerprint(): string {
  const r = readRegisters();
  return REGISTER_NAMES.map((n) => `${n}=${r[n] ?? ''}`).join('\u0000');
}

/** Registers are module-global: shared by every editor on the page and kept after unmount. */
export function resetRegisters(): void {
  const rc = Vim.getRegisterController();
  rc.unnamedRegister.clear();
  for (const n of REGISTER_NAMES) {
    if (n === '"') continue;
    const r = rc.registers[n];
    if (r) r.clear();
  }
}

export function snapshot(view: EditorView): EditorSnapshot {
  return {
    doc: view.state.doc.toString(),
    cursor: readCursor(view),
    selection: readSelection(view),
    mode: readMode(view),
    pendingKeys: readPending(view).display,
    registers: readRegisters(),
  };
}

export function setCursor(view: EditorView, pos: Pos): void {
  const offset = posToOffset(view.state.doc, pos);
  view.dispatch({ selection: { anchor: offset, head: offset }, scrollIntoView: true });
}

/** `<lt>` is unwrapped to a bare '<' (docs/CONTRACT.md §4 rule 4b). */
export function parseVimKeys(keys: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < keys.length) {
    const ch = keys.charAt(i);
    if (ch === '<') {
      const close = keys.indexOf('>', i);
      if (close > i) {
        const named = keys.slice(i, close + 1);
        out.push(named === '<lt>' ? '<' : named);
        i = close + 1;
        continue;
      }
    }
    out.push(ch);
    i += 1;
  }
  return out;
}

const PRINTABLE = /^[\x20-\x7e]$/;

/** `<Tab>` must match the Tab binding in VimEditor's keymap so a replayed Tab indents the same way. */
const INSERT_NAMED: Record<string, string> = {
  '<Space>': ' ',
  '<CR>': '\n',
  '<Enter>': '\n',
  '<Tab>': '\t',
};

/** handleKey inserts no insert-mode text and cannot type into the `/` `?` `:` panel, so both are fed directly. */
export function feedKeys(view: EditorView, keys: string): void {
  const cm = getCM(view);
  if (!cm) return;
  const list = parseVimKeys(keys);

  for (let i = 0; i < list.length; i++) {
    const key = list[i];
    if (key === undefined) break;

    if ((key === '/' || key === '?' || key === ':') && !cm.state.vim?.insertMode) {
      const rest: string[] = [];
      let j = i + 1;
      for (; j < list.length; j++) {
        const next = list[j];
        if (next === undefined || next === '<CR>' || next === '<Enter>') break;
        rest.push(next);
      }
      Vim.handleKey(cm, key, 'macro');
      const input = view.dom.querySelector<HTMLInputElement>('.cm-vim-panel input');
      if (input) {
        input.value = rest.join('');
        input.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }),
        );
      }
      i = j;
      continue;
    }

    if (cm.state.vim?.insertMode) {
      // `<C-r><register>` must reach vim whole, or the register name is typed as text.
      if (key === '<C-r>') {
        Vim.handleKey(cm, key, 'macro');
        const register = list[i + 1];
        if (register !== undefined) {
          Vim.handleKey(cm, register, 'macro');
          i += 1;
        }
        continue;
      }

      // Insert into EVERY range: a blockwise `<C-v>` I/A insert is N cursors.
      if (PRINTABLE.test(key)) {
        view.dispatch(view.state.replaceSelection(key), { userEvent: 'input.type' });
        continue;
      }
      const text = INSERT_NAMED[key];
      if (text === '\t') {
        indentMore(view);
        continue;
      }
      if (text !== undefined) {
        view.dispatch(view.state.replaceSelection(text), { userEvent: 'input.type' });
        continue;
      }
      if (key === '<S-Tab>') {
        indentLess(view);
        continue;
      }
      if (key === '<BS>') {
        deleteCharBackward(view);
        continue;
      }
    }

    Vim.handleKey(cm, key, 'macro');
  }
}

/** Swapping the doc does not leave insert mode: vim's mode lives on cm.state.vim. */
export function forceNormalMode(view: EditorView): void {
  const cm = getCM(view);
  const vs = cm?.state.vim;
  if (!cm || !vs) return;
  if (vs.insertMode) Vim.exitInsertMode(cm as never, true);
  if (vs.visualMode) Vim.exitVisualMode(cm as never, false);
  Vim.handleKey(cm, '<Esc>', 'macro');
}

export interface ResetOptions {
  doc: string;
  cursor?: Pos;
  setupKeys?: string;
  clearRegisters?: boolean;
}

export function resetExercise(view: EditorView, opts: ResetOptions): void {
  forceNormalMode(view);
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: opts.doc },
    selection: { anchor: 0 },
  });
  if (opts.clearRegisters !== false) resetRegisters();
  if (opts.cursor) setCursor(view, opts.cursor);
  if (opts.setupKeys) feedKeys(view, opts.setupKeys);
}

const NAMED: Record<string, string> = {
  Escape: 'Esc',
  Enter: 'CR',
  Tab: 'Tab',
  ' ': 'Space',
  Backspace: 'BS',
  Delete: 'Del',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
};

export const ARROW_KEYS = new Set(['<Left>', '<Right>', '<Up>', '<Down>']);

export function keyName(e: KeyboardEvent): string {
  const fromVim = Vim.vimKeyFromEvent(e);
  if (fromVim) return fromVim;
  const base = NAMED[e.key] ?? e.key;
  if (base.length > 1 || e.ctrlKey || e.altKey || e.metaKey) {
    let mods = '';
    if (e.ctrlKey) mods += 'C-';
    if (e.altKey) mods += 'A-';
    if (e.metaKey) mods += 'M-';
    if (e.shiftKey && base.length > 1) mods += 'S-';
    return `<${mods}${base}>`;
  }
  return base;
}

/** Match the input, not the panel: vim also puts notices like '1 lines yanked' in .cm-vim-panel. */
export function promptOpen(view: EditorView): boolean {
  return !!view.dom.querySelector('.cm-vim-panel input');
}

const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Dead']);

export interface VimBridgeHandlers {
  onModeChange?(mode: EditorMode, previous: EditorMode): void;
  onPendingChange?(pending: PendingCommand): void;
  onKeystroke?(record: KeystrokeRecord, snapshot: EditorSnapshot): void;
  onSnapshot?(snapshot: EditorSnapshot): void;
  onUndo?(nowWasted: KeystrokeRecord[]): void;
  onAttemptReset?(): void;
  onEscapeHatch?(): void;
}

export interface VimBridge {
  readonly view: EditorView;
  mode(): EditorMode;
  pending(): PendingCommand;
  snapshot(): EditorSnapshot;
  register(name: string): RegisterValue;
  keystrokes(): readonly KeystrokeRecord[];
  count(): number;
  wastedCount(): number;
  resetAttempt(): void;
  feed(keys: string): void;
  reset(opts: ResetOptions): void;
  focus(): void;
  destroy(): void;
}

export function createVimBridge(view: EditorView, handlers: VimBridgeHandlers = {}): VimBridge {
  const cm = getCM(view);
  let mode: EditorMode = readMode(view);
  let pending: PendingCommand = readPending(view);
  let records: KeystrokeRecord[] = [];
  let seq = 0;

  const onModeChange = (e: VimModeChangeEvent) => {
    const next = normalizeMode(e);
    if (next === mode) return;
    const prev = mode;
    mode = next;
    handlers.onModeChange?.(next, prev);
  };
  cm?.on('vim-mode-change', onModeChange);

  const publishPending = () => {
    const next = readPending(view);
    if (next.display === pending.display) return;
    pending = next;
    handlers.onPendingChange?.(next);
  };

  interface InFlight {
    rec: KeystrokeRecord;
    docBefore: string;
    cursorBefore: string;
    pendingBefore: string;
    registersBefore: string;
    undoDepthBefore: number;
  }
  let inFlight: InFlight | null = null;
  /** The settle timer can fire after destroy(), in the same task as a keydown that unmounted the editor. */
  let destroyed = false;

  const settle = () => {
    if (destroyed) return;
    const f = inFlight;
    inFlight = null;
    if (!f) return;

    const docAfter = view.state.doc.toString();
    const cursorAfter = String(view.state.selection.main.head);
    const registersAfter = registerFingerprint();
    const pendingAfter = readPending(view).display;

    f.rec.pendingAdvanced = pendingAfter !== '';

    // docs/CONTRACT.md §6: a key is wasted only when it COMPLETES a command that changed nothing.
    // Prompt keys, the Esc hatch, mode changes and yanks (a register change) are never waste.
    f.rec.wasted =
      !f.rec.pendingAdvanced &&
      docAfter === f.docBefore &&
      cursorAfter === f.cursorBefore &&
      registersAfter === f.registersBefore &&
      !f.rec.inPrompt &&
      !f.rec.escapeHatch &&
      !promptOpen(view) &&
      readMode(view) === f.rec.mode;

    f.rec.undoDepth = undoDepth(view.state);
    records.push(f.rec);

    // Runs before the handlers below so onKeystroke reads the charged-back counts, not one key stale.
    // Approximation: undo groups by CodeMirror's newGroupDelay, not by vim's insert session.
    let undone: KeystrokeRecord[] | null = null;
    if (docAfter !== f.docBefore && f.rec.undoDepth < f.undoDepthBefore) {
      const newDepth = f.rec.undoDepth;
      const nowWasted: KeystrokeRecord[] = [];
      let i = records.length - 2;
      for (; i >= 0; i--) {
        const r = records[i];
        if (r === undefined || r.undone || r.undoDepth <= newDepth) break;
        r.undone = true;
        nowWasted.push(r);
      }
      for (; i >= 0; i--) {
        const r = records[i];
        if (r === undefined || r.undone || !r.pendingAdvanced) break;
        r.undone = true;
        nowWasted.push(r);
      }
      const opener = i >= 0 ? records[i] : undefined;
      if (opener !== undefined && !opener.undone && records[i + 1]?.mode === 'insert') {
        opener.undone = true;
        nowWasted.push(opener);
      }
      f.rec.undone = true;
      nowWasted.push(f.rec);
      undone = nowWasted.reverse();
    }

    const snap = snapshot(view);
    handlers.onKeystroke?.(f.rec, snap);
    publishPending();
    handlers.onSnapshot?.(snap);
    if (undone) handlers.onUndo?.(undone);
  };

  const onKeyDownCapture = (e: KeyboardEvent) => {
    if (destroyed) return;
    if (MODIFIER_KEYS.has(e.key)) return;
    if (e.isTrusted === false) return;

    // A fast typist can land the next keydown before the previous settle timer.
    if (inFlight) settle();

    // Decide the Esc Esc hatch here: vim clears its pending state on Esc, and no keymap can run before vim.
    let escapeHatch = false;
    if (
      e.key === 'Escape' &&
      readMode(view) === 'normal' &&
      !promptOpen(view) &&
      !readPending(view).active
    ) {
      escapeHatch = true;
      view.contentDOM.blur();
      handlers.onEscapeHatch?.();
    }
    // Not preventDefault()ed: vim's own Esc still clears search highlighting.

    seq += 1;
    inFlight = {
      rec: {
        seq,
        key: keyName(e),
        at: performance.now(),
        mode: readMode(view),
        wasted: false,
        pendingAdvanced: false,
        undoDepth: 0,
        inPrompt: promptOpen(view),
        escapeHatch,
        undone: false,
      },
      docBefore: view.state.doc.toString(),
      cursorBefore: String(view.state.selection.main.head),
      pendingBefore: readPending(view).display,
      registersBefore: registerFingerprint(),
      undoDepthBefore: undoDepth(view.state),
    };
    const mine = inFlight;
    // A macrotask, not a microtask: browsers run microtasks between listeners of a real user event.
    setTimeout(() => {
      if (inFlight === mine) settle();
    }, 0);
  };

  // view.dom, NOT contentDOM: at the target phase capture is ignored and CodeMirror's listener runs first.
  view.dom.addEventListener('keydown', onKeyDownCapture, true);

  return {
    view,
    mode: () => mode,
    pending: () => pending,
    snapshot: () => snapshot(view),
    register: (name) => readRegister(name),
    keystrokes: () => records,
    count: () => records.length,
    wastedCount: () => records.filter((r) => r.wasted || r.undone).length,
    resetAttempt() {
      records = [];
      seq = 0;
      inFlight = null;
      handlers.onAttemptReset?.();
    },
    feed(keys) {
      feedKeys(view, keys);
      mode = readMode(view);
      pending = readPending(view);
    },
    reset(opts) {
      resetExercise(view, opts);
      records = [];
      seq = 0;
      inFlight = null;
      handlers.onAttemptReset?.();
      const prev = mode;
      mode = readMode(view);
      pending = readPending(view);
      handlers.onModeChange?.(mode, prev);
      handlers.onPendingChange?.(pending);
      handlers.onSnapshot?.(snapshot(view));
    },
    focus() {
      view.focus();
    },
    destroy() {
      destroyed = true;
      inFlight = null;
      cm?.off('vim-mode-change', onModeChange);
      view.dom.removeEventListener('keydown', onKeyDownCapture, true);
    },
  };
}
