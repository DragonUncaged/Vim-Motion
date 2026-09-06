/** Clamps rather than throws (docs/CONTRACT.md §4 rule 6); vim-bridge.ts has the CodeMirror `Text` twin of this maths. */

import type { Pos } from '@/content/types';

function lineStarts(doc: string): number[] {
  const starts = [0];
  for (let i = 0; i < doc.length; i++) {
    if (doc[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

export function offsetToPos(doc: string, offset: number): Pos {
  const off = Math.max(0, Math.min(doc.length, offset));
  const starts = lineStarts(doc);
  let line = 0;
  let lineStart = 0;
  for (const [i, start] of starts.entries()) {
    if (start > off) break;
    line = i;
    lineStart = start;
  }
  return { line, ch: off - lineStart };
}

export function posToOffset(doc: string, pos: Pos): number {
  const starts = lineStarts(doc);
  const line = Math.max(0, Math.min(starts.length - 1, pos.line));
  const start = starts[line] ?? 0;
  const next = starts[line + 1];
  const end = next === undefined ? doc.length : next - 1;
  return Math.max(start, Math.min(end, start + Math.max(0, pos.ch)));
}

export function nthIndexOf(doc: string, text: string, occurrence: number): number {
  if (text === '' || occurrence < 0) return -1;
  let from = 0;
  for (let n = 0; ; n++) {
    const at = doc.indexOf(text, from);
    if (at === -1) return -1;
    if (n === occurrence) return at;
    from = at + text.length;
  }
}
