import { test } from 'node:test';
import assert from 'node:assert/strict';

import { allLessons, catalogue, catalogueByModule, lessonsByModule, modules } from '../index.ts';
import { buildMotionLessonIndex } from '../../../components/cheatsheet/lessonLinks.ts';
import { at, get } from '@/scripts/test-utils.ts';

const LESSON_ONLY = ['explanation'] as const;
const EXERCISE_ONLY = [
  'prompt',
  'startDoc',
  'startCursor',
  'goal',
  'solution',
  'par',
  'hint',
  'setupKeys',
] as const;

test('the catalogue is the registry, lesson for lesson, in the same order', () => {
  assert.equal(catalogue.length, allLessons.length);
  catalogue.forEach((card, i) => {
    const lesson = at(allLessons, i);
    assert.equal(card.slug, lesson.slug);
    assert.equal(card.title, lesson.title);
    assert.equal(card.module, lesson.module);
    assert.equal(card.order, lesson.order);
    assert.equal(card.summary, lesson.summary);
    assert.equal(card.language, lesson.language);
    assert.deepEqual(card.keys, lesson.keys);
    assert.deepEqual(
      card.exercises.map((e) => e.id),
      lesson.exercises.map((e) => e.id),
    );
    assert.deepEqual(
      card.exercises.map((e) => e.motions),
      lesson.exercises.map((e) => e.motions),
    );
  });
});

test('no teaching material survives into the catalogue', () => {
  for (const card of catalogue) {
    for (const field of LESSON_ONLY) {
      assert.ok(!(field in card), `catalogue lesson ${card.slug} still carries ${field}`);
    }
    for (const exercise of card.exercises) {
      assert.deepEqual(
        Object.keys(exercise).sort(),
        ['id', 'motions'],
        `catalogue exercise ${card.slug}/${exercise.id} carries more than id and motions`,
      );
      for (const field of EXERCISE_ONLY) {
        assert.ok(!(field in exercise), `${card.slug}/${exercise.id} still carries ${field}`);
      }
    }
  }
});

test('catalogueByModule matches lessonsByModule module for module', () => {
  assert.deepEqual(Object.keys(catalogueByModule).sort(), Object.keys(lessonsByModule).sort());
  for (const { id } of modules) {
    assert.deepEqual(
      get(catalogueByModule, id).map((l) => l.slug),
      lessonsByModule[id].map((l) => l.slug),
      `module ${id} differs between the catalogue and the registry`,
    );
  }
});

test('the cheatsheet motion index is unchanged by dropping the teaching material', () => {
  assert.deepEqual(buildMotionLessonIndex(catalogue), buildMotionLessonIndex(allLessons));
});
