import type { Metadata } from 'next';
import { CurriculumIndex } from '@/components/learn/CurriculumIndex';
import { JsonLd } from '@/components/seo/JsonLd';
import { catalogue, catalogueByModule, modules } from '@/content/lessons';
import { pageMetadata } from '@/lib/seo/copy';
import { curriculumJsonLd } from '@/lib/seo/jsonLd';

export const metadata: Metadata = pageMetadata({
  title: 'Vim motion lessons, in order',
  description:
    `${catalogue.length} lessons in ${modules.length} modules: modes and hjkl, the operator ` +
    'grammar and text objects, the same motions on real React, Go and C++ files, then ' +
    'registers, macros and the global command.',
});

export default function Page() {
  return (
    <>
      <JsonLd data={curriculumJsonLd(modules, catalogueByModule)} />
      <CurriculumIndex modules={modules} lessons={catalogue} lessonsByModule={catalogueByModule} />
    </>
  );
}
