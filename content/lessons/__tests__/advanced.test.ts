import { createRequire } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Installs the DOM on globalThis; anything that imports CodeMirror must come after it.
import { createEditor, type View } from '@/scripts/jsdom-editor.ts';
import type { Exercise } from '../../types.ts';
import { at, get } from '@/scripts/test-utils.ts';

import { allLessons, lessonsByModule, modules } from '../index.ts';

const { feedKeys, resetExercise, snapshot } = await import('../../../lib/engine/vim-bridge.ts');
const { evaluateGoal } = await import('../../../lib/engine/goal.ts');

const require = createRequire(import.meta.url);
const { fireAnEvent } = require('jsdom/lib/jsdom/living/helpers/events.js') as {
  fireAnEvent: (name: string, target: unknown, iface: unknown, init: object) => boolean;
};
const KeyboardEvent = require('jsdom/lib/generated/idl/KeyboardEvent.js') as unknown;
const { implForWrapper } = require('jsdom/lib/generated/idl/utils.js') as {
  implForWrapper: (wrapper: unknown) => unknown;
};

function keydown(view: View, key: string): void {
  const target = view.dom.querySelector('.cm-vim-panel input') ?? view.contentDOM;
  const init: Record<string, unknown> = { key, bubbles: true, cancelable: true };
  if (key === 'Enter') init.keyCode = 13;
  fireAnEvent('keydown', implForWrapper(target), KeyboardEvent, init);
}

const commandLineOpen = (view: View): boolean =>
  view.dom.querySelector('.cm-vim-panel input') !== null;

function panelInput(view: View): HTMLInputElement {
  const input = view.dom.querySelector('.cm-vim-panel input');
  assert.ok(input, 'the prompt panel is open');
  return input as HTMLInputElement;
}

const solved = (exercise: Exercise, view: View): boolean =>
  evaluateGoal(exercise.goal, snapshot(view));

function runThroughPanel(view: View, exercise: Exercise, opener: string, rest: string): boolean {
  keydown(view, opener);
  const input = panelInput(view);
  const beforeTyping = solved(exercise, view);
  input.value = rest;
  const beforeEnter = solved(exercise, view);
  keydown(view, 'Enter');
  return beforeTyping || beforeEnter;
}

function lessonFor(slug: string) {
  const lesson = allLessons.find((l) => l.slug === slug);
  assert.ok(lesson, `lesson ${slug} is registered`);
  return lesson;
}

function exerciseFor(slug: string, id: string): Exercise {
  const exercise = lessonFor(slug).exercises.find((e) => e.id === id);
  assert.ok(exercise, `${slug}#${id} exists`);
  return exercise;
}

test('the advanced module is registered last, with its five lessons in order', () => {
  const advanced = modules.find((m) => m.id === 'advanced');
  assert.ok(advanced, 'content/modules.ts declares it');
  assert.equal(advanced.order, 6);

  const lessons = get(lessonsByModule, 'advanced');
  assert.deepEqual(
    lessons.map((l) => l.slug),
    ['registers', 'macro-workflows', 'substitute', 'global-command', 'dot-at-scale'],
  );
  lessons.forEach((lesson, i) => {
    assert.equal(lesson.order, i + 1, `${lesson.slug} is at ${i + 1}`);
    assert.equal(lesson.module, 'advanced');
  });
});

test('the advanced lessons come after every other module in the walk order', () => {
  const first = allLessons.findIndex((l) => l.module === 'advanced');
  assert.ok(first > 0, 'the module is in the global order');
  assert.ok(
    allLessons.slice(first).every((l) => l.module === 'advanced'),
    'nothing from another module follows it, so "next lesson" ends inside it',
  );
});

const EX_COMMANDS: ReadonlyArray<{ slug: string; id: string; command: string }> = [
  { slug: 'substitute', id: 'rename-everywhere', command: '%s/sessions/tokens/g' },
  { slug: 'substitute', id: 'narrow-the-range', command: '5,6s/staging/live/g' },
  { slug: 'global-command', id: 'drop-the-todos', command: 'g/TODO/d' },
  { slug: 'global-command', id: 'keep-only-sessions', command: 'v/sessions/d' },
  { slug: 'global-command', id: 'mark-the-todos', command: 'g/TODO/norm A (unowned)' },
];

for (const { slug, id, command } of EX_COMMANDS) {
  test(`${slug}#${id} is solved by the Enter, not by the colon`, () => {
    const exercise = exerciseFor(slug, id);
    assert.equal(
      exercise.solution,
      `:${command}<CR>`,
      'the test types what the exercise claims is the solution',
    );

    const view = createEditor(exercise.startDoc, 'text');
    try {
      resetExercise(view, {
        doc: exercise.startDoc,
        cursor: exercise.startCursor,
        setupKeys: exercise.setupKeys,
      });
      assert.equal(solved(exercise, view), false, 'not already solved at mount');

      const earlyPass = runThroughPanel(view, exercise, ':', command);
      assert.equal(earlyPass, false, 'the goal does not hold while the command is unrun');
      assert.equal(solved(exercise, view), true, 'and does hold once Enter runs it');
    } finally {
      view.destroy();
    }
  });
}

test('substitute#reuse-the-search leaves the pattern for the empty //', () => {
  const exercise = exerciseFor('substitute', 'reuse-the-search');
  const view = createEditor(exercise.startDoc, 'text');
  try {
    resetExercise(view, { doc: exercise.startDoc, cursor: exercise.startCursor });

    const searchSolved = runThroughPanel(view, exercise, '/', 'TODO');
    assert.equal(searchSolved, false);
    assert.equal(solved(exercise, view), false, 'searching for TODO changes no text');

    const subSolved = runThroughPanel(view, exercise, ':', '%s//done/');
    assert.equal(subSolved, false, 'the goal does not hold while the substitute is unrun');
    assert.equal(
      solved(exercise, view),
      true,
      'an empty pattern reuses the last search through the DOM path too',
    );
  } finally {
    view.destroy();
  }
});

test('no solution in the curriculum leaves the command line open', () => {
  // Not `promptOpen`: vim's "1 lines yanked" notice is a `.cm-vim-panel` too.
  for (const lesson of allLessons) {
    for (const exercise of lesson.exercises) {
      const view = createEditor(exercise.startDoc, lesson.language);
      try {
        resetExercise(view, {
          doc: exercise.startDoc,
          cursor: exercise.startCursor,
          setupKeys: exercise.setupKeys,
        });
        assert.equal(
          commandLineOpen(view),
          false,
          `${lesson.slug}#${exercise.id} setupKeys leave a command line open`,
        );
        feedKeys(view, exercise.solution);
        assert.equal(
          commandLineOpen(view),
          false,
          `${lesson.slug}#${exercise.id} solution leaves a command line open`,
        );
      } finally {
        view.destroy();
      }
    }
  }
});

test('no solution in the curriculum puts a prompt character straight after r', () => {
  for (const lesson of allLessons) {
    for (const exercise of lesson.exercises) {
      for (const [field, keys] of [
        ['solution', exercise.solution],
        ['setupKeys', exercise.setupKeys ?? ''],
      ] as const) {
        assert.equal(
          /r[:/?]/.test(keys),
          false,
          `${lesson.slug}#${exercise.id} ${field}: use a different replacement character`,
        );
      }
    }
  }
});

test('the advanced module teaches motions no earlier module already owns', () => {
  const earlier = new Set(
    allLessons
      .filter((l) => l.module !== 'advanced')
      .flatMap((l) => l.exercises.flatMap((e) => e.motions)),
  );
  const own = new Set(
    get(lessonsByModule, 'advanced').flatMap((l) => l.exercises.flatMap((e) => e.motions)),
  );
  const fresh = [...own].filter((m) => !earlier.has(m));
  assert.ok(
    fresh.length >= 8,
    `only ${fresh.length} new motions (${fresh.join(', ')}) — an advanced module that ` +
      'reteaches the basics is not an advanced module',
  );
  for (const motion of [':g', ':v', ':norm', 'cgn', 'dgn', '"A', '"0']) {
    assert.ok(own.has(motion), `${motion} is trained somewhere in the module`);
  }
});

test('at() and the first advanced lesson agree about where the module starts', () => {
  assert.equal(at(get(lessonsByModule, 'advanced'), 0).slug, 'registers');
});
