import type { LessonCard, Module } from '@/content/types';
import { plainProse } from '@/lib/prose/richtext-parse';
import { SITE_URL } from '@/lib/site';
import { SITE_DESCRIPTION, SITE_NAME } from './copy';

// No ratings, reviews, offers or hasCourseInstance: none exist, and a guessed courseWorkload would be wrong on every page.

export type JsonLdNode = Record<string, unknown>;

export function absolute(path: string): string {
  return SITE_URL === '' ? path : `${SITE_URL}${path}`;
}

const CONTEXT = 'https://schema.org';

const provider: JsonLdNode = {
  '@type': 'Organization',
  '@id': absolute('/#organization'),
  name: SITE_NAME,
  url: absolute('/'),
};

/** CONTRACT §0 */
const free = { isAccessibleForFree: true, inLanguage: 'en' };

const CURRICULUM = {
  '@id': absolute('/learn#curriculum'),
  name: 'Vim motions, from hjkl to real code',
  description:
    'A course in vim motions, worked in a real vim editor in the browser: modes and hjkl, ' +
    'the operator grammar and text objects, then the same motions on real React, Go and ' +
    'C++ files.',
  url: absolute('/learn'),
  educationalLevel: 'Beginner to advanced',
};

function moduleParts(lessons: LessonCard[]): JsonLdNode[] {
  return lessons.map((lesson) => ({
    '@type': 'LearningResource',
    '@id': absolute(`/learn/${lesson.slug}`),
    name: lesson.title,
    url: absolute(`/learn/${lesson.slug}`),
    position: lesson.order,
  }));
}

export function moduleCourse(module: Module, lessons: LessonCard[]): JsonLdNode {
  return {
    '@type': 'Course',
    '@id': absolute(`/learn#${module.id}`),
    name: module.name,
    description: plainProse(module.blurb),
    url: absolute(`/learn#${module.id}`),
    position: module.order,
    provider,
    ...free,
    ...(lessons.length === 0 ? {} : { hasPart: moduleParts(lessons) }),
  };
}

export function curriculumJsonLd(
  modules: Module[],
  lessonsByModule: Record<string, LessonCard[]>,
): JsonLdNode {
  return {
    '@context': CONTEXT,
    '@graph': [
      {
        '@type': 'Course',
        ...CURRICULUM,
        provider,
        teaches: modules.map((module) => module.name),
        ...free,
        hasPart: modules.map((module) => moduleCourse(module, lessonsByModule[module.id] ?? [])),
      },
      breadcrumbs([
        { name: SITE_NAME, path: '/' },
        { name: 'Lessons', path: '/learn' },
      ]),
    ],
  };
}

export function lessonJsonLd(lesson: LessonCard, module: Module): JsonLdNode {
  const path = `/learn/${lesson.slug}`;
  const teaches = [...new Set([...lesson.keys, ...lesson.exercises.flatMap((e) => e.motions)])];
  return {
    '@context': CONTEXT,
    '@graph': [
      {
        '@type': 'LearningResource',
        '@id': absolute(path),
        name: lesson.title,
        url: absolute(path),
        description: plainProse(lesson.summary),
        learningResourceType: 'Lesson',
        educationalUse: 'Practice',
        teaches,
        position: lesson.order,
        provider,
        ...free,
        isPartOf: {
          '@type': 'Course',
          '@id': absolute(`/learn#${module.id}`),
          name: module.name,
          url: absolute(`/learn#${module.id}`),
        },
      },
      breadcrumbs([
        { name: SITE_NAME, path: '/' },
        { name: 'Lessons', path: '/learn' },
        { name: module.name, path: `/learn#${module.id}` },
        { name: lesson.title, path },
      ]),
    ],
  };
}

export function siteJsonLd(): JsonLdNode {
  return {
    '@context': CONTEXT,
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': absolute('/#website'),
        name: SITE_NAME,
        url: absolute('/'),
        description: SITE_DESCRIPTION,
        publisher: provider,
        ...free,
      },
      { '@type': 'Course', ...CURRICULUM, provider, ...free },
    ],
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbs(trail: Crumb[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: absolute(crumb.path),
    })),
  };
}
