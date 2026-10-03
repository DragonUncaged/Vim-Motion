'use client';

import { Fragment, useCallback, useState, type ReactNode } from 'react';
import { ClayButton } from '@/components/clay/ClayButton';

const TOKEN =
  /(\/\/[^\n]*)|('(?:[^'\\]|\\.)*')|(`(?:[^`\\]|\\.)*`)|("(?:[^"\\]|\\.)*")|(\b\d+\b)|(\b(?:import|export|const|let|interface|from|return|function|true|false|null|undefined)\b)/g;

const TOKEN_CLASS = ['tok-com', 'tok-str', 'tok-str', 'tok-str', 'tok-num', 'tok-kw'];

function highlight(source: string) {
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  TOKEN.lastIndex = 0;

  while ((match = TOKEN.exec(source)) !== null) {
    if (match.index > last)
      nodes.push(<Fragment key={last}>{source.slice(last, match.index)}</Fragment>);
    const group = match.slice(1).findIndex((g) => g !== undefined);
    nodes.push(
      <span key={match.index} className={TOKEN_CLASS[group] ?? ''}>
        {match[0]}
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < source.length) nodes.push(<Fragment key={last}>{source.slice(last)}</Fragment>);
  return nodes;
}

export interface CodeBlockProps {
  code: string;
  filename: string;
}

export function CodeBlock({ code, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    // navigator.clipboard is undefined outside a secure context.
    const clipboard: Clipboard | undefined = navigator.clipboard;
    if (clipboard === undefined) return;
    void clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // Refused — the code is still there to select by hand.
      });
  }, [code]);

  return (
    <figure className="clay-editor hue-violet m-0">
      <figcaption className="clay-editor-title">
        <span className="min-w-0 truncate">{filename}</span>
        <ClayButton
          intent="ghost"
          onClick={copy}
          className="ml-auto px-3 py-1 text-[0.75rem]"
          aria-label={`Copy ${filename}`}
        >
          {copied ? 'Copied' : 'Copy'}
        </ClayButton>
      </figcaption>
      <pre className="clay-editor-well m-0" style={{ fontSize: '0.8125rem' }}>
        <code>{highlight(code)}</code>
      </pre>
    </figure>
  );
}
