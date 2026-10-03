import type { Metadata } from 'next';
import { Landing } from '@/components/landing/Landing';
import { JsonLd } from '@/components/seo/JsonLd';
import { pageMetadata, SITE_DESCRIPTION } from '@/lib/seo/copy';
import { siteJsonLd } from '@/lib/seo/jsonLd';

const TITLE = 'Vim Clay — learn vim motions with your hands';

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: SITE_DESCRIPTION,
  shareTitle: TITLE,
});

export default function Page() {
  return (
    <>
      <JsonLd data={siteJsonLd()} />
      <Landing />
    </>
  );
}
