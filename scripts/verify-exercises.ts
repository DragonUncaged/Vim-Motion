import type { Exercise, Goal, Lesson, LessonLanguage } from '../content/types.ts';

import { createEditor, type View } from './jsdom-editor.ts';

const { feedKeys, parseVimKeys, resetExercise, snapshot } =
  await import('../lib/engine/vim-bridge.ts');
const { evaluateGoal, describeGoal } = await import('../lib/engine/goal.ts');
const { allLessons, lessonsByModule, modules } = await import('../content/lessons/index.ts');

interface Finding {
  where: string;
  message: string;
  detail?: string;
}

const errors: Finding[] = [];
const notices: Finding[] = [];

const fail = (where: string, message: string, detail?: string) =>
  errors.push({ where, message, detail });
const note = (where: string, message: string, detail?: string) =>
  notices.push({ where, message, detail });

// Every named key docs/CONTRACT.md §4's notation allows.
const NAMED_KEY =
  /^<(?:lt|Esc|CR|Enter|Tab|Space|BS|Del|Left|Right|Up|Down|Home|End|PageUp|PageDown|[CASM]-[^>]+)>$/;

function checkKeyNotation(where: string, field: string, keys: string): void {
  let i = 0;
  while (i < keys.length) {
    if (keys[i] !== '<') {
      i += 1;
      continue;
    }
    const close = keys.indexOf('>', i);
    if (close < 0) {
      fail(
        where,
        `${field} has an unclosed '<'`,
        'A literal less-than must be written <lt> (docs/CONTRACT.md §4 rule 4b). ' +
          `Got: ${JSON.stringify(keys)}`,
      );
      return;
    }
    const named = keys.slice(i, close + 1);
    if (!NAMED_KEY.test(named)) {
      fail(
        where,
        `${field} contains ${named}, which is not a named key`,
        'A literal < is written <lt>; a bare < opens a named-key sequence ' +
          '(docs/CONTRACT.md §4 rule 4b).',
      );
    }
    i = close + 1;
  }
}

function requiresNormalMode(goal: Goal): boolean {
  if (goal.type === 'mode') return goal.mode === 'normal';
  if (goal.type === 'all') return goal.goals.some(requiresNormalMode);
  return false;
}

function posInside(doc: string, line: number, ch: number): boolean {
  const text = doc.split('\n')[line];
  if (line < 0 || text === undefined) return false;
  return ch >= 0 && ch <= text.length;
}

// lib/drills/route.ts joins slug and id into one segment split on dots, so neither may contain one.
const KEBAB = /^[a-z0-9-]+$/;

function checkShape(lesson: Lesson, exercise: Exercise, where: string): void {
  if (!KEBAB.test(exercise.id)) {
    fail(
      where,
      `exercise id ${JSON.stringify(exercise.id)} is not kebab-case`,
      'Ids go into a stored progress key and into the /practice/speedrun.<slug>.<id> ' +
        'segment, which lib/drills/route.ts splits on the dots. Use [a-z0-9-] only.',
    );
  }
  if (!exercise.prompt.trim()) fail(where, 'empty prompt');
  if (!exercise.solution.trim()) fail(where, 'empty solution');
  if (exercise.motions.length === 0) fail(where, 'empty motions[]');
  if (exercise.motions.some((m) => !m.trim())) fail(where, 'blank entry in motions[]');

  if (exercise.startDoc.includes('\r')) {
    fail(where, 'startDoc contains a carriage return', 'docs/CONTRACT.md §4 rule 4: use \\n only.');
  }
  if (!posInside(exercise.startDoc, exercise.startCursor.line, exercise.startCursor.ch)) {
    fail(
      where,
      `startCursor {line:${exercise.startCursor.line}, ch:${exercise.startCursor.ch}} is outside startDoc`,
      `startDoc has ${exercise.startDoc.split('\n').length} lines.`,
    );
  }

  checkKeyNotation(where, 'solution', exercise.solution);
  if (exercise.setupKeys) checkKeyNotation(where, 'setupKeys', exercise.setupKeys);

  const keystrokes = parseVimKeys(exercise.solution).length;
  if (exercise.par < keystrokes) {
    fail(
      where,
      `par is ${exercise.par} but the solution is ${keystrokes} keys`,
      'Efficiency is min(par/keystrokes,1)*100, so a learner playing the ideal solution could ' +
        'never reach 100%. par is the ideal count, not a limit.',
    );
  } else if (exercise.par > keystrokes * 2 && exercise.par - keystrokes > 4) {
    note(
      where,
      `par is ${exercise.par} for a ${keystrokes}-key solution`,
      'Generous on purpose, or a leftover from an earlier draft?',
    );
  }

  if (exercise.allowedKeys?.length) {
    const allowed = new Set([...exercise.allowedKeys, '<Esc>']);
    const used = parseVimKeys(exercise.solution).filter((k) => !allowed.has(k));
    if (used.length > 0) {
      fail(
        where,
        `solution uses ${used.map((k) => JSON.stringify(k)).join(', ')}, outside allowedKeys`,
        'A learner who plays the official solution would fail the attempt.',
      );
    }
  }

  const expected: Record<string, LessonLanguage> = {
    'react-tsx': 'tsx',
    go: 'go',
    cpp: 'cpp',
  };
  const want = expected[lesson.module];
  if (want && lesson.language !== want) {
    fail(
      lesson.slug,
      `language is "${lesson.language}", expected "${want}" for module ${lesson.module}`,
    );
  }
}

interface ReplayResult {
  solved: boolean;
  trueAtMount: boolean;
  truncatedStillSolves: boolean | null;
  error?: string;
  finalDoc?: string;
  cursor?: string;
  mode?: string;
}

// Skips prompt solutions: feedKeys' incremental search reads solved before <CR>, which Chrome does not.
function truncatedSolution(solution: string): string | null {
  if (/[/?:]/.test(solution)) return null;
  const keys = parseVimKeys(solution);
  if (keys.length < 2) return null;
  return keys
    .slice(0, -1)
    .map((k) => (k === '<' ? '<lt>' : k))
    .join('');
}

function replay(exercise: Exercise, language: LessonLanguage): ReplayResult {
  let view: View | null = null;
  try {
    view = createEditor(exercise.startDoc, language);
    const reset = () =>
      resetExercise(view!, {
        doc: exercise.startDoc,
        cursor: exercise.startCursor,
        setupKeys: exercise.setupKeys,
      });

    reset();
    const trueAtMount = evaluateGoal(exercise.goal, snapshot(view));

    feedKeys(view, exercise.solution);
    const snap = snapshot(view);
    const solved = evaluateGoal(exercise.goal, snap);

    let truncatedStillSolves: boolean | null = null;
    const shorter = solved ? truncatedSolution(exercise.solution) : null;
    if (shorter !== null) {
      reset();
      feedKeys(view, shorter);
      truncatedStillSolves = evaluateGoal(exercise.goal, snapshot(view));
    }

    return {
      solved,
      trueAtMount,
      truncatedStillSolves,
      finalDoc: snap.doc,
      cursor: `{line:${snap.cursor.line}, ch:${snap.cursor.ch}}`,
      mode: snap.mode,
    };
  } catch (e) {
    return {
      solved: false,
      trueAtMount: false,
      truncatedStillSolves: null,
      error:
        e instanceof Error
          ? `${e.message}\n    ${(e.stack ?? '').split('\n').slice(1, 4).join('\n    ')}`
          : String(e),
    };
  } finally {
    view?.destroy();
  }
}

const startedAt = Date.now();
let checked = 0;
let solved = 0;

// Guards against Vim.unmap(); see configureVimGlobals in lib/engine/vim-bridge.ts.
{
  const view = createEditor('if (x = 1)\nsecond line', 'text');
  for (const key of [
    's',
    'S',
    '<Left>',
    '<Right>',
    '<Up>',
    '<Down>',
    '<Space>',
    '<BS>',
    '<Del>',
    '<Home>',
    '<End>',
  ]) {
    resetExercise(view, { doc: 'if (x = 1)\nsecond line', cursor: { line: 0, ch: 2 } });
    try {
      feedKeys(view, key);
    } catch (e) {
      fail(
        'keymap',
        `${key} threw inside the vim extension`,
        `${e instanceof Error ? e.message : String(e)}\n  ` +
          'Almost certainly a Vim.unmap() call somewhere: it splices defaultKeymap without ' +
          'adjusting defaultKeymapLength, and every keyToKey binding breaks afterwards.',
      );
    }
  }
  view.destroy();
}

for (const mod of modules) {
  const lessons = lessonsByModule[mod.id];
  if (lessons.length === 0) fail(mod.id, 'module has no lessons');
  lessons.forEach((lesson, i) => {
    if (lesson.order !== i + 1) {
      fail(lesson.slug, `order is ${lesson.order}, expected ${i + 1} in module ${mod.id}`);
    }
  });
}
{
  const moduleIds = new Set<string>(modules.map((m) => m.id));
  for (const lesson of allLessons) {
    if (!moduleIds.has(lesson.module)) {
      fail(lesson.slug, `module "${lesson.module}" is not in content/modules.ts`);
    }
    if (!KEBAB.test(lesson.slug)) {
      fail(
        lesson.slug,
        `slug ${JSON.stringify(lesson.slug)} is not kebab-case`,
        'The slug is the /learn/<slug> URL segment and half of the ' +
          '/practice/speedrun.<slug>.<id> segment. Use [a-z0-9-] only.',
      );
    }
  }
}

const failedExercises: string[] = [];

for (const lesson of allLessons) {
  const ids = new Set<string>();
  for (const exercise of lesson.exercises) {
    const where = `${lesson.slug}#${exercise.id}`;
    if (ids.has(exercise.id)) fail(where, 'duplicate exercise id within the lesson');
    ids.add(exercise.id);

    checkShape(lesson, exercise, where);

    checked += 1;
    const result = replay(exercise, lesson.language);

    if (result.trueAtMount) {
      fail(
        where,
        'goal is already true before the solution',
        `goal      ${describeGoal(exercise.goal)}\n  ` +
          'The site evaluates the goal after every keystroke from the first one on, so any ' +
          'key that leaves the state alone solves this. Set the premise with setupKeys ' +
          'instead of asking the learner to go somewhere and come back.',
      );
    }

    const keys = parseVimKeys(exercise.solution);
    if (keys.at(-1) === '<Esc>' && !requiresNormalMode(exercise.goal)) {
      fail(
        where,
        'solution ends in <Esc> but the goal does not require mode: normal',
        `goal      ${describeGoal(exercise.goal)}\n  ` +
          "Wrap it: { type: 'all', goals: [<existing>, { type: 'mode', mode: 'normal' }] }. " +
          'par is unchanged; the solution already counts the <Esc>.',
      );
    }

    if (result.truncatedStillSolves === true) {
      note(
        where,
        'goal still holds with the last solution key removed',
        `solution  ${JSON.stringify(exercise.solution)} — the final ` +
          `${JSON.stringify(keys.at(-1))} changes nothing the goal can see.`,
      );
    }

    if (result.solved) {
      solved += 1;
      process.stdout.write('.');
    } else {
      process.stdout.write('x');
      failedExercises.push(where);
      const detail = result.error
        ? `threw: ${result.error}`
        : [
            `goal      ${describeGoal(exercise.goal)}`,
            `solution  ${JSON.stringify(exercise.solution)}`,
            exercise.setupKeys ? `setupKeys ${JSON.stringify(exercise.setupKeys)}` : '',
            `cursor    ${result.cursor}   mode ${result.mode}`,
            `document after replay:`,
            (result.finalDoc ?? '')
              .split('\n')
              .map((l, i) => `  ${String(i).padStart(2)} ${JSON.stringify(l)}`)
              .join('\n  '),
          ]
            .filter(Boolean)
            .join('\n  ');
      fail(where, 'solution does not reach its goal', detail);
    }
  }
}

process.stdout.write('\n\n');

const line = '─'.repeat(72);

if (notices.length > 0) {
  console.log('Notices (not failures)\n' + line);
  for (const n of notices) {
    console.log(`  ${n.where}: ${n.message}`);
    if (n.detail) console.log(`    ${n.detail}`);
  }
  console.log('');
}

if (errors.length > 0) {
  console.log('Failures\n' + line);
  for (const e of errors) {
    console.log(`\n  ${e.where}: ${e.message}`);
    if (e.detail) console.log(`  ${e.detail}`);
  }
  console.log('');
}

console.log(line);
console.log(`  Lessons    ${allLessons.length}`);
console.log(`  Exercises  ${checked} checked, ${solved} solved, ${checked - solved} failed`);
console.log(`  Findings   ${errors.length} failures, ${notices.length} notices`);
console.log(`  Duration   ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
console.log(line);

if (errors.length > 0) {
  console.log(
    '\nFix the exercise data, never the assertion. A goal that cannot be reached is a\n' +
      'lesson nobody can finish, and there is no support inbox to complain to.\n',
  );
  if (failedExercises.length > 0) {
    console.log(`Unsolvable: ${failedExercises.join(', ')}\n`);
  }
  process.exit(1);
}

console.log('\nEvery exercise reaches its goal through the real editor.\n');
