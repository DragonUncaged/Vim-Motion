import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { absolute, curriculumJsonLd, lessonJsonLd, siteJsonLd } from '../jsonLd.ts';
import { catalogue, catalogueByModule, modules } from '@/content/lessons/index.ts';
import { SITE_URL } from '@/lib/site.ts';
import { at } from '@/scripts/test-utils.ts';

function nodes(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (value === null || typeof value !== 'object') return [];
  const node = value as Record<string, unknown>;
  return [node, ...Object.values(node).flatMap(nodes)];
}

const graphs = [
  { where: '/', data: siteJsonLd() },
  { where: '/learn', data: curriculumJsonLd(modules, catalogueByModule) },
  ...catalogue.map((lesson) => ({
    where: `/learn/${lesson.slug}`,
    data: lessonJsonLd(
      lesson,
      modules.find((m) => m.id === lesson.module)!,
    ),
  })),
];

describe('every graph the site emits', () => {
  it('survives the round trip a crawler makes', () => {
    for (const { where, data } of graphs) {
      const text = JSON.stringify(data);
      assert.deepEqual(JSON.parse(text), data, where);
      assert.equal(data['@context'], 'https://schema.org', where);
    }
  });

  it('gives every node a type', () => {
    for (const { where, data } of graphs) {
      for (const node of nodes(data)) {
        if ('@id' in node || 'name' in node)
          assert.ok('@type' in node, `${where}: ${JSON.stringify(node).slice(0, 80)}`);
      }
    }
  });

  it('claims no rating, no review and no price', () => {
    for (const { where, data } of graphs) {
      for (const node of nodes(data)) {
        for (const banned of ['aggregateRating', 'review', 'reviewCount', 'offers', 'price']) {
          assert.ok(!(banned in node), `${where}: node carries ${banned}`);
        }
      }
    }
  });

  it('emits URLs that render correctly with lib/site.ts empty', () => {
    for (const { where, data } of graphs) {
      for (const node of nodes(data)) {
        for (const key of ['url', '@id', 'item']) {
          const value = node[key];
          if (typeof value !== 'string') continue;
          if (SITE_URL === '') {
            assert.ok(value.startsWith('/'), `${where}: ${key} "${value}" is not root-relative`);
          } else {
            assert.ok(value.startsWith(SITE_URL), `${where}: ${key} "${value}" left the origin`);
          }
          assert.ok(!/localhost|example\.(com|org)/.test(value), `${where}: placeholder in ${key}`);
        }
      }
    }
  });
});

describe('the lesson graph', () => {
  const lesson = catalogue.find((l) => l.slug === 'delete')!;
  const parent = modules.find((m) => m.id === lesson.module)!;
  const graph = lessonJsonLd(lesson, parent) as { '@graph': Record<string, unknown>[] };
  const resource = at(graph['@graph'], 0);
  const crumbs = at(graph['@graph'], 1);

  it('is a LearningResource that names its position in its module', () => {
    assert.equal(resource['@type'], 'LearningResource');
    assert.equal(resource.name, lesson.title);
    assert.equal(resource.position, lesson.order);
    assert.equal(
      (resource.isPartOf as Record<string, unknown>)['@id'],
      absolute(`/learn#${parent.id}`),
    );
  });

  it('teaches every motion the lesson actually trains', () => {
    const teaches = resource.teaches as string[];
    for (const key of lesson.keys) assert.ok(teaches.includes(key), key);
    for (const exercise of lesson.exercises) {
      for (const motion of exercise.motions) assert.ok(teaches.includes(motion), motion);
    }
    assert.equal(new Set(teaches).size, teaches.length, 'teaches repeats itself');
  });

  it('walks home, lessons, module, lesson — in that order, numbered from one', () => {
    assert.equal(crumbs['@type'], 'BreadcrumbList');
    const trail = crumbs.itemListElement as Record<string, unknown>[];
    assert.deepEqual(
      trail.map((c) => c.position),
      [1, 2, 3, 4],
    );
    assert.deepEqual(
      trail.map((c) => c.item),
      [
        absolute('/'),
        absolute('/learn'),
        absolute(`/learn#${parent.id}`),
        absolute(`/learn/${lesson.slug}`),
      ],
    );
  });
});

describe('the curriculum graph', () => {
  const graph = curriculumJsonLd(modules, catalogueByModule) as {
    '@graph': Record<string, unknown>[];
  };
  const course = at(graph['@graph'], 0);

  it('holds every module, and every module holds its lessons', () => {
    const parts = course.hasPart as Record<string, unknown>[];
    assert.equal(parts.length, modules.length);
    let counted = 0;
    for (const part of parts) {
      assert.equal(part['@type'], 'Course');
      counted += ((part.hasPart as unknown[] | undefined) ?? []).length;
    }
    assert.equal(
      counted,
      catalogue.length,
      'the graph and the curriculum disagree on lesson count',
    );
  });

  it('describes the same curriculum as the landing page does', () => {
    const onHome = (siteJsonLd() as { '@graph': Record<string, unknown>[] })['@graph'].find(
      (node) => node['@type'] === 'Course',
    )!;
    assert.equal(onHome['@id'], course['@id']);
    assert.equal(onHome.name, course.name);
    assert.equal(onHome.description, course.description);
  });
});
