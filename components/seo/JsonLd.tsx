import type { JsonLdNode } from '@/lib/seo/jsonLd';

/** A text child, not dangerouslySetInnerHTML (docs/CONTRACT.md §5); `<` is escaped so a string cannot close the script. */
export function JsonLd({ data }: { data: JsonLdNode }) {
  return (
    <script type="application/ld+json">{JSON.stringify(data).replace(/</g, '\\u003c')}</script>
  );
}
