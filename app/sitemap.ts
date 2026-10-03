import type { MetadataRoute } from 'next';
import { allLessons } from '@/content/lessons';
import { categories } from '@/lib/drills';
import { SITE_URL } from '@/lib/site';

const TOP_LEVEL = ['/', '/learn', '/practice', '/sandbox', '/stats', '/cheatsheet', '/about'];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...TOP_LEVEL,
    ...allLessons.map((lesson) => `/learn/${lesson.slug}`),
    ...categories.map((category) => `/practice/${category.id}`),
  ].map((path) => ({ url: `${SITE_URL}${path}` }));
}
