import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LessonRunner, type LessonLink } from '@/components/learn/LessonRunner';
import { JsonLd } from '@/components/seo/JsonLd';
import { allLessons, lessonBySlug, modules, nextLesson, prevLesson } from '@/content/lessons';
import type { Lesson, Module } from '@/content/types';
import { lessonCopy, pageMetadata } from '@/lib/seo/copy';
import { lessonJsonLd } from '@/lib/seo/jsonLd';

interface Params {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return allLessons.map((lesson) => ({ slug: lesson.slug }));
}

export const dynamicParams = false;

function moduleOf(lesson: Lesson): Module | undefined {
  return modules.find((m) => m.id === lesson.module);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const lesson = lessonBySlug(slug);
  if (lesson === undefined) return { title: 'Lesson not found' };
  return pageMetadata(lessonCopy(lesson));
}

const link = (lesson: Lesson | undefined): LessonLink | null =>
  lesson === undefined ? null : { slug: lesson.slug, title: lesson.title };

export default async function Page({ params }: Params) {
  const { slug } = await params;
  const lesson = lessonBySlug(slug);
  if (lesson === undefined) notFound();
  const parent = moduleOf(lesson);
  if (parent === undefined) notFound();
  return (
    <>
      <JsonLd data={lessonJsonLd(lesson, parent)} />
      <LessonRunner
        lesson={lesson}
        module={{ id: parent.id, name: parent.name }}
        previous={link(prevLesson(slug))}
        next={link(nextLesson(slug))}
      />
    </>
  );
}
