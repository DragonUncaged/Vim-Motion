// Synthetic 8x16 monospace geometry: jsdom has no layout, so without it j, k, Ctrl+d and Ctrl+u do nothing.
// Importing this installs the DOM on globalThis, so import CodeMirror only after it.

import { JSDOM } from 'jsdom';

import type { LessonLanguage } from '../content/types.ts';
import {
  HIGHLIGHTED_LANGUAGES,
  cachedLanguage,
  loadLanguage,
} from '../components/editor/languages.ts';

const CHAR_W = 8;
const LINE_H = 16;
const VIEWPORT_LINES = 20;

interface Rect {
  x: number;
  y: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

function rect(left: number, top: number, width: number, height: number): Rect {
  return {
    x: left,
    y: top,
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
  };
}

export function installDom(): Window & typeof globalThis {
  const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', {
    pretendToBeVisual: true,
    // jsdom refuses localStorage on the default about:blank origin.
    url: 'http://localhost/',
  });
  const w = dom.window as unknown as Window & typeof globalThis;

  // `navigator` and friends are getter-only on Node's globalThis, so plain assignment throws.
  const put = (key: string, value: unknown) => {
    try {
      Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
    } catch {
      /* a global Node will not let go of; CodeMirror does not need it */
    }
  };
  for (const key of Object.getOwnPropertyNames(w)) {
    if (key in globalThis) continue;
    put(key, (w as unknown as Record<string, unknown>)[key]);
  }
  for (const key of [
    'window',
    'document',
    'navigator',
    'getComputedStyle',
    'requestAnimationFrame',
    'cancelAnimationFrame',
  ]) {
    put(key, (w as unknown as Record<string, unknown>)[key]);
  }

  const win = w as unknown as Record<string, unknown>;
  win.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  put('ResizeObserver', win.ResizeObserver);

  installGeometry(w);
  return w;
}

function installGeometry(w: Window & typeof globalThis): void {
  type El = Element & { classList: DOMTokenList; textContent: string | null };

  const lineOf = (el: Element): { index: number; line: Element } | null => {
    const line = el.classList?.contains('cm-line') ? el : el.closest?.('.cm-line');
    if (!line) return null;
    const content = line.parentElement;
    if (!content) return null;
    return { index: Array.prototype.indexOf.call(content.children, line), line };
  };

  const contentRect = (content: Element): Rect => {
    let widest = 1;
    for (const child of content.children) {
      widest = Math.max(widest, child.textContent?.length ?? 0);
    }
    return rect(0, 0, widest * CHAR_W, Math.max(1, content.children.length) * LINE_H);
  };

  w.Element.prototype.getBoundingClientRect = function (this: El): DOMRect {
    if (this.classList?.contains('cm-line')) {
      const info = lineOf(this)!;
      return rect(
        0,
        info.index * LINE_H,
        (this.textContent?.length ?? 0) * CHAR_W,
        LINE_H,
      ) as unknown as DOMRect;
    }
    if (this.classList?.contains('cm-content')) {
      return contentRect(this) as unknown as DOMRect;
    }
    const content = this.querySelector?.('.cm-content');
    if (content) {
      return rect(0, 0, 80 * CHAR_W, VIEWPORT_LINES * LINE_H) as unknown as DOMRect;
    }
    const info = lineOf(this);
    if (info) {
      const lineText = info.line.textContent ?? '';
      const own = this.textContent ?? '';
      const at = Math.max(0, lineText.indexOf(own));
      return rect(
        at * CHAR_W,
        info.index * LINE_H,
        own.length * CHAR_W,
        LINE_H,
      ) as unknown as DOMRect;
    }
    return rect(0, 0, 80 * CHAR_W, VIEWPORT_LINES * LINE_H) as unknown as DOMRect;
  };

  // Without this CodeMirror's height oracle falls back to 14px/7px guesses and `3j` lands four lines down.
  w.Element.prototype.getClientRects = function (this: Element): DOMRectList {
    const list = [this.getBoundingClientRect()];
    (list as unknown as DOMRectList).item = (i: number) => list[i] ?? null;
    return list as unknown as DOMRectList;
  };

  const rangeRect = function (this: Range): Rect | null {
    const node = this.startContainer;
    const el = node.nodeType === 3 ? node.parentElement : (node as Element);
    const info = el ? lineOf(el) : null;
    if (!info) return null;

    let before = 0;
    const walk = (n: Node): boolean => {
      if (n === node) return true;
      if (n.nodeType === 3) {
        before += (n as Text).data.length;
        return false;
      }
      for (const child of Array.from(n.childNodes)) if (walk(child)) return true;
      return false;
    };
    walk(info.line);

    const lineLength = (info.line.textContent ?? '').length;
    const from = before + (node.nodeType === 3 ? this.startOffset : 0);
    const to = before + (node.nodeType === 3 ? this.endOffset : lineLength);
    return rect(from * CHAR_W, info.index * LINE_H, Math.max(0, to - from) * CHAR_W, LINE_H);
  };

  w.Range.prototype.getClientRects = function (this: Range): DOMRectList {
    const r = rangeRect.call(this);
    const list: Rect[] = r ? [r] : [];
    (list as unknown as DOMRectList).item = (i: number) => (list[i] ?? null) as DOMRect;
    return list as unknown as DOMRectList;
  };
  w.Range.prototype.getBoundingClientRect = function (this: Range): DOMRect {
    return (rangeRect.call(this) ?? rect(0, 0, 0, 0)) as unknown as DOMRect;
  };

  for (const [prop, pick] of [
    ['clientHeight', (r: Rect) => r.height],
    ['clientWidth', (r: Rect) => r.width],
    ['offsetHeight', (r: Rect) => r.height],
    ['offsetWidth', (r: Rect) => r.width],
  ] as const) {
    Object.defineProperty(w.Element.prototype, prop, {
      get(this: Element) {
        return pick(this.getBoundingClientRect());
      },
      configurable: true,
    });
  }
}

export const win = installDom();

const { EditorState } = await import('@codemirror/state');
const { EditorView, keymap, lineNumbers, drawSelection } = await import('@codemirror/view');

export type View = InstanceType<typeof EditorView>;
const { history, historyKeymap, indentMore, indentLess } = await import('@codemirror/commands');
const { bracketMatching, indentOnInput } = await import('@codemirror/language');
const { configureVimGlobals } = await import('../lib/engine/vim-bridge.ts');
const { vim, getCM } = await import('@replit/codemirror-vim');

configureVimGlobals();

await Promise.all(HIGHLIGHTED_LANGUAGES.map((language) => loadLanguage(language)));

// Mirrors the extension list in components/editor/VimEditor.tsx, minus the visual pieces, in the same order.
export function createEditor(doc: string, language: LessonLanguage): View {
  const host = win.document.getElementById('host')!;
  host.innerHTML = '';
  return new EditorView({
    parent: host,
    state: EditorState.create({
      doc,
      extensions: [
        vim(),
        EditorState.allowMultipleSelections.of(true),
        keymap.of([
          {
            key: 'Tab',
            run: (v) => (getCM(v)?.state.vim?.insertMode ? indentMore(v) : false),
            shift: (v) => (getCM(v)?.state.vim?.insertMode ? indentLess(v) : false),
          },
        ]),
        lineNumbers(),
        history({ newGroupDelay: 2000 }),
        drawSelection(),
        bracketMatching(),
        indentOnInput(),
        cachedLanguage(language) ?? [],
        keymap.of(historyKeymap),
      ],
    }),
  });
}
