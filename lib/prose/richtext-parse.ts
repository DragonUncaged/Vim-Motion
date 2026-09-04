/** docs/CONTRACT.md §5: four constructs, everything else is literal text, and this must never throw. */

export type ProseToken =
  | { kind: 'text'; value: string }
  | { kind: 'code'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'keys'; keys: string[] };

export function splitKeyGroup(inner: string): string[] {
  const keys: string[] = [];
  let i = 0;
  while (i < inner.length) {
    if (inner[i] === '<') {
      const close = inner.indexOf('>', i + 1);
      if (close > i + 1) {
        const named = inner.slice(i + 1, close);
        keys.push(named === 'lt' ? '<' : named);
        i = close + 1;
        continue;
      }
    }
    // Surrogate pairs: step by code point so an emoji is never split in half.
    const cp = inner.codePointAt(i);
    const ch = cp === undefined ? inner.charAt(i) : String.fromCodePoint(cp);
    keys.push(ch);
    i += ch.length;
  }
  return keys;
}

function pushText(tokens: ProseToken[], value: string): void {
  if (value === '') return;
  const last = tokens[tokens.length - 1];
  if (last?.kind === 'text') {
    last.value += value;
    return;
  }
  tokens.push({ kind: 'text', value });
}

export function parseProse(source: string): ProseToken[] {
  const tokens: ProseToken[] = [];
  if (typeof source !== 'string' || source === '') return tokens;

  let i = 0;
  let literalStart = 0;

  const flush = (upTo: number): void => {
    pushText(tokens, source.slice(literalStart, upTo));
  };

  while (i < source.length) {
    if (source.startsWith('[[', i)) {
      const close = source.indexOf(']]', i + 2);
      const inner = close === -1 ? '' : source.slice(i + 2, close);
      if (close !== -1 && inner !== '' && !inner.includes('[[')) {
        flush(i);
        tokens.push({ kind: 'keys', keys: splitKeyGroup(inner) });
        i = close + 2;
        literalStart = i;
        continue;
      }
      i += 2;
      continue;
    }

    if (source.startsWith('**', i)) {
      const close = source.indexOf('**', i + 2);
      if (close !== -1 && close > i + 2) {
        flush(i);
        tokens.push({ kind: 'bold', value: source.slice(i + 2, close) });
        i = close + 2;
        literalStart = i;
        continue;
      }
      i += 2;
      continue;
    }

    if (source[i] === '`') {
      const close = source.indexOf('`', i + 1);
      if (close !== -1 && close > i + 1) {
        flush(i);
        tokens.push({ kind: 'code', value: source.slice(i + 1, close) });
        i = close + 1;
        literalStart = i;
        continue;
      }
      i += 1;
      continue;
    }

    i += 1;
  }

  flush(source.length);
  return tokens;
}

export function plainProse(source: string): string {
  return parseProse(source)
    .map((token) => (token.kind === 'keys' ? token.keys.join('') : token.value))
    .join('');
}
