/** Passive: never calls preventDefault, so browser shortcuts stay the browser's (docs/CONTRACT.md §7). */

export type KeyName = string;

const NAMED_KEYS: Record<string, KeyName> = {
  Escape: 'Esc',
  Esc: 'Esc',
  Enter: 'CR',
  Return: 'CR',
  Tab: 'Tab',
  ' ': 'Space',
  Spacebar: 'Space',
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
  Insert: 'Insert',
};

const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'AltGraph']);

function fromCode(code: string): KeyName | null {
  const letter = /^Key([A-Z])$/.exec(code)?.[1];
  if (letter !== undefined) return letter.toLowerCase();
  const digit = /^Digit([0-9])$/.exec(code)?.[1];
  if (digit !== undefined) return digit;
  return null;
}

export function normalizeKeyEvent(event: KeyboardEvent): KeyName | null {
  const raw = event.key;
  if (MODIFIER_KEYS.has(raw)) return null;

  let base = NAMED_KEYS[raw];
  if (base === undefined) {
    if (raw === 'Dead' || raw === 'Unidentified' || raw === undefined) {
      base = fromCode(event.code) ?? '';
      if (base === '') return null;
    } else {
      base = raw;
    }
  }

  if (event.ctrlKey || event.metaKey) {
    const letter = base.length === 1 ? base.toLowerCase() : base;
    return `C-${letter}`;
  }
  if (event.altKey) {
    const letter = base.length === 1 ? base.toLowerCase() : base;
    return `M-${letter}`;
  }
  return base;
}

/** `<lt>` is the escape for a literal `<` (docs/CONTRACT.md §4 rule 4b). */
export function normalizeKeyName(written: string): KeyName {
  const inner = written.startsWith('<') && written.endsWith('>') ? written.slice(1, -1) : written;
  if (inner === 'lt') return '<';
  const named = NAMED_KEYS[inner];
  if (named !== undefined) return named;
  const ctrl = /^(?:C|Ctrl|Control)-(.+)$/i.exec(inner)?.[1];
  if (ctrl !== undefined) return `C-${ctrl.length === 1 ? ctrl.toLowerCase() : ctrl}`;
  const alt = /^(?:M|Alt|Meta)-(.+)$/i.exec(inner)?.[1];
  if (alt !== undefined) return `M-${alt.length === 1 ? alt.toLowerCase() : alt}`;
  return inner;
}

export interface KeyEvent {
  key: KeyName;
  down: boolean;
  at: number;
}

type Listener = (event: KeyEvent) => void;

const listeners = new Set<Listener>();
const pressed = new Set<KeyName>();
let revision = 0;
let attached = false;

export const SEQUENCE_GAP_MS = 600;

const RECENT_LENGTH = 8;

export interface RecentKey {
  key: KeyName;
  at: number;
}

const recent: RecentKey[] = [];

function remember(key: KeyName, at: number): void {
  recent.push({ key, at });
  if (recent.length > RECENT_LENGTH) recent.shift();
}

export function tokenizeKeyLabel(label: string): KeyName[] {
  const whole = normalizeKeyName(label);
  if (whole.length === 1 || isNamedKey(whole)) return [whole];
  const tokens: KeyName[] = [];
  let i = 0;
  while (i < label.length) {
    const ch = label.charAt(i);
    if (ch === '<') {
      const close = label.indexOf('>', i + 1);
      if (close !== -1) {
        tokens.push(normalizeKeyName(label.slice(i, close + 1)));
        i = close + 1;
        continue;
      }
    }
    tokens.push(ch);
    i += 1;
  }
  return tokens;
}

const NAMED_VALUES = new Set(Object.values(NAMED_KEYS));

function isNamedKey(name: KeyName): boolean {
  return NAMED_VALUES.has(name) || /^[CM]-.+$/.test(name);
}

export function sequenceDown(
  tokens: KeyName[],
  history: readonly RecentKey[],
  held: (key: KeyName) => boolean,
  gap: number = SEQUENCE_GAP_MS,
): boolean {
  const last = tokens.at(-1);
  if (last === undefined || !held(last)) return false;
  if (tokens.length === 1) return true;
  if (history.length < tokens.length) return false;
  const tail = history.slice(history.length - tokens.length);
  return tokens.every((token, i) => {
    const entry = tail[i];
    if (entry?.key !== token) return false;
    const previous = tail[i - 1];
    return previous === undefined || entry.at - previous.at <= gap;
  });
}

export function isSequenceDown(tokens: KeyName[]): boolean {
  return sequenceDown(tokens, recent, isKeyDown);
}

function emit(key: KeyName, down: boolean): void {
  revision += 1;
  const event: KeyEvent = {
    key,
    down,
    at: typeof performance === 'undefined' ? 0 : performance.now(),
  };
  for (const listener of listeners) listener(event);
}

function onKeyDown(event: KeyboardEvent): void {
  const key = normalizeKeyEvent(event);
  if (key === null) return;
  if (event.repeat && pressed.has(key)) return;
  pressed.add(key);
  remember(key, typeof performance === 'undefined' ? 0 : performance.now());
  emit(key, true);
}

function onKeyUp(event: KeyboardEvent): void {
  const key = normalizeKeyEvent(event);
  if (key === null) return;
  if (!pressed.delete(key)) return;
  emit(key, false);
}

/** Browsers send no keyup once focus leaves the window, so a held cap would stick down. */
function releaseEverything(): void {
  if (pressed.size === 0) return;
  const stuck = [...pressed];
  pressed.clear();
  revision += 1;
  for (const key of stuck) {
    const event: KeyEvent = {
      key,
      down: false,
      at: typeof performance === 'undefined' ? 0 : performance.now(),
    };
    for (const listener of listeners) listener(event);
  }
}

function attach(): void {
  if (attached || typeof window === 'undefined') return;
  attached = true;
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);
  window.addEventListener('blur', releaseEverything);
}

function detach(): void {
  if (!attached || typeof window === 'undefined') return;
  attached = false;
  window.removeEventListener('keydown', onKeyDown, true);
  window.removeEventListener('keyup', onKeyUp, true);
  window.removeEventListener('blur', releaseEverything);
  releaseEverything();
}

export function subscribeKeys(listener: Listener): () => void {
  listeners.add(listener);
  attach();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) detach();
  };
}

export function isKeyDown(key: KeyName): boolean {
  return pressed.has(key);
}

export function pressedKeys(): KeyName[] {
  return [...pressed];
}

export function keyboardRevision(): number {
  return revision;
}
