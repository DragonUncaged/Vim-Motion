import { Fragment } from 'react';
import { Key, type ClayHue } from '@/components/clay/Key';
import { parseProse } from '@/lib/prose/richtext-parse';

/** docs/CONTRACT.md §5. No HTML parsing and no dangerouslySetInnerHTML. */
export interface RichTextProps {
  children: string;
  hue?: ClayHue;
  as?: 'p' | 'span' | 'div' | null;
  className?: string;
}

export function RichText({ children, hue = 'violet', as = 'span', className }: RichTextProps) {
  const nodes = parseProse(children).map((token, i) => {
    switch (token.kind) {
      case 'text':
        return <Fragment key={i}>{token.value}</Fragment>;
      case 'bold':
        return <strong key={i}>{token.value}</strong>;
      case 'code':
        return (
          <code key={i} className="clay-code">
            {token.value}
          </code>
        );
      case 'keys':
        return (
          <span key={i} className="inline-flex items-baseline gap-[0.15em]">
            {token.keys.map((k, j) => (
              <Key key={j} label={k} hue={hue} size="inline" />
            ))}
          </span>
        );
    }
  });

  if (as === null) return <>{nodes}</>;
  const Tag = as;
  return <Tag className={className}>{nodes}</Tag>;
}
