import { test } from 'node:test';
import assert from 'node:assert/strict';

import { at } from '../test-utils.ts';

import {
  CURRICULUM_MARKERS,
  EDITOR_MARKERS,
  LANDING,
  PARSER_MARKERS,
  controlProblems,
  firstLoadProblems,
} from '../bundle-check.mjs';

const clean = { [LANDING]: ['static/chunks/page.js'] };

test('a clean landing page reports nothing', () => {
  assert.deepEqual(
    firstLoadProblems(clean, () => 'export default function Landing(){}'),
    [],
  );
});

test('every editor marker in the landing First Load is caught, one problem each', () => {
  for (const marker of EDITOR_MARKERS) {
    const problems = firstLoadProblems(clean, () => `class X{}//${marker}`);
    assert.equal(problems.length, 1, `${marker} was not caught`);
    assert.match(at(problems, 0), /leaked into/);
    assert.ok(at(problems, 0).includes(marker));
  }
});

test('an editor marker on another route is not the landing page failing', () => {
  const pages = { '/sandbox/page': ['static/chunks/sandbox.js'] };
  assert.deepEqual(
    firstLoadProblems(pages, () => 'cm-editor'),
    [],
  );
});

test('a parser marker fails on any route, landing or not', () => {
  for (const marker of PARSER_MARKERS) {
    for (const route of [LANDING, '/learn/[slug]/page']) {
      const problems = firstLoadProblems({ [route]: ['static/chunks/x.js'] }, () => marker);
      assert.equal(problems.length, 1, `${marker} was not caught on ${route}`);
      assert.match(at(problems, 0), /bundled instead of fetched/);
    }
  }
});

test('the chunk that carries a marker is named, not just the route', () => {
  const pages = { [LANDING]: ['static/chunks/a.js', 'static/chunks/b.js'] };
  const problems = firstLoadProblems(pages, (chunk) =>
    chunk.endsWith('b.js') ? 'cm-content' : '',
  );
  assert.equal(problems.length, 1);
  assert.ok(at(problems, 0).startsWith('static/chunks/b.js'));
});

test('lesson text fails on any route — that is the whole curriculum in a first load', () => {
  for (const marker of CURRICULUM_MARKERS) {
    for (const route of [LANDING, '/practice/[drill]/page']) {
      const problems = firstLoadProblems({ [route]: ['static/chunks/x.js'] }, () => marker);
      assert.equal(problems.length, 1, `${marker} was not caught on ${route}`);
      assert.match(at(problems, 0), /whole curriculum is bundled/);
    }
  }
});

test('a chunk can fail on more than one marker class at once', () => {
  const problems = firstLoadProblems({ [LANDING]: ['static/chunks/x.js'] }, () =>
    ['cm-vim', 'goLanguage', CURRICULUM_MARKERS[0]].join(' '),
  );
  assert.equal(problems.length, 3);
});

test('the control fails when a marker has vanished from the whole build', () => {
  const all = [...EDITOR_MARKERS, ...PARSER_MARKERS, ...CURRICULUM_MARKERS];
  assert.deepEqual(controlProblems([all.join(' ')]), []);

  const problems = controlProblems(['nothing recognisable here']);
  assert.equal(problems.length, all.length);
  assert.match(at(problems, 0), /proves nothing/);
});
