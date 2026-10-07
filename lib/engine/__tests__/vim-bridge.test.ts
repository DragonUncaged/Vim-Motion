import { strict as assert } from 'node:assert';
import { createRequire } from 'node:module';
import { test } from 'node:test';

// Installs the DOM on globalThis. Everything that imports CodeMirror comes after it.
import { createEditor, type View } from '@/scripts/jsdom-editor.ts';
import { at, get } from '@/scripts/test-utils.ts';

const { createVimBridge, feedKeys, resetExercise, snapshot } = await import('../vim-bridge.ts');
type Handlers = NonNullable<Parameters<typeof createVimBridge>[1]>;

// Public dispatchEvent cannot make a trusted event, so this uses jsdom's internal fireAnEvent.
const require = createRequire(import.meta.url);
const { fireAnEvent } = require('jsdom/lib/jsdom/living/helpers/events.js') as {
  fireAnEvent: (name: string, target: unknown, iface: unknown, init: object) => boolean;
};
const KeyboardEvent = require('jsdom/lib/generated/idl/KeyboardEvent.js') as unknown;
const { implForWrapper } = require('jsdom/lib/generated/idl/utils.js') as {
  implForWrapper: (wrapper: unknown) => unknown;
};

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function keydown(view: View, key: string): boolean {
  const target = view.dom.querySelector('.cm-vim-panel input') ?? view.contentDOM;
  const init: Record<string, unknown> = { key, bubbles: true, cancelable: true };
  if (key === 'Enter') init.keyCode = 13;
  return fireAnEvent('keydown', implForWrapper(target), KeyboardEvent, init);
}

function mount(doc: string, handlers: Handlers = {}) {
  const view = createEditor(doc, 'text');
  const bridge = createVimBridge(view, handlers);
  bridge.reset({ doc, cursor: { line: 0, ch: 0 } });
  return { view, bridge };
}

test('a key handled through the DOM is counted, one settle later', async () => {
  const fired: string[] = [];
  const { view, bridge } = mount('one two', {
    onKeystroke: (r) => fired.push(`key:${r.key}`),
    onSnapshot: () => fired.push('snapshot'),
  });
  fired.length = 0;

  keydown(view, 'x');
  assert.deepEqual(fired, [], 'the settle is a macrotask, nothing fires inside the dispatch');
  await tick();

  assert.deepEqual(fired, ['key:x', 'snapshot']);
  assert.equal(bridge.count(), 1);
  assert.equal(snapshot(view).doc, 'ne two', 'vim handled the trusted keydown');
  bridge.destroy();
  view.destroy();
});

test('a settle timer that outlives destroy() fires nothing', async () => {
  const fired: string[] = [];
  const { view, bridge } = mount('one two', {
    onKeystroke: (r) => fired.push(`key:${r.key}`),
    onSnapshot: () => fired.push('snapshot'),
  });
  fired.length = 0;

  keydown(view, 'x');
  bridge.destroy();
  view.destroy();
  await tick();

  assert.deepEqual(fired, [], 'no handler runs after destroy');
  assert.equal(bridge.count(), 0, 'the key was never recorded');
});

/** docs/CONTRACT.md §6 */

async function play(view: View, keys: string[]): Promise<void> {
  for (const key of keys) {
    keydown(view, key);
    await tick();
  }
}

const marks = (bridge: ReturnType<typeof createVimBridge>) =>
  bridge
    .keystrokes()
    .map(
      (r) =>
        r.key +
        (r.wasted ? ' wasted' : '') +
        (r.undone ? ' undone' : '') +
        (r.pendingAdvanced ? ' pending' : '') +
        (r.inPrompt ? ' prompt' : '') +
        (r.escapeHatch ? ' hatch' : ''),
    );

test('dw is two keys and none of them wasted', async () => {
  const { view, bridge } = mount('one two three');
  await play(view, ['d', 'w']);
  assert.equal(snapshot(view).doc, 'two three');
  assert.equal(bridge.count(), 2);
  assert.equal(bridge.wastedCount(), 0, 'the d of dw completes nothing, so it is not waste');
  assert.deepEqual(marks(bridge), ['d pending', 'w']);
  bridge.destroy();
  view.destroy();
});

test('u charges back the keys that made the change, and itself', async () => {
  const undone: string[][] = [];
  const { view, bridge } = mount('one two three', {
    onUndo: (now) => undone.push(now.map((r) => r.key)),
  });
  await play(view, ['d', 'w', 'u']);
  assert.equal(snapshot(view).doc, 'one two three');
  assert.equal(bridge.count(), 3);
  assert.equal(bridge.wastedCount(), 3);
  assert.deepEqual(marks(bridge), ['d undone pending', 'w undone', 'u undone']);
  assert.equal(undone.length, 1);
  assert.deepEqual([...at(undone, 0)].sort(), ['d', 'u', 'w']);
  bridge.destroy();
  view.destroy();
});

test('keys typed into the / prompt are not wasted', async () => {
  const { view, bridge } = mount('one two three');
  await play(view, ['/']);
  const input = view.dom.querySelector<HTMLInputElement>('.cm-vim-panel input');
  assert.ok(input, 'the / prompt is open');
  input.value = 'two';
  await play(view, ['Enter']);
  assert.deepEqual(snapshot(view).cursor, { line: 0, ch: 4 }, 'the search moved the cursor');
  assert.equal(bridge.count(), 2);
  assert.equal(bridge.wastedCount(), 0);
  assert.deepEqual(marks(bridge), ['/ pending', '<CR> prompt']);
  bridge.destroy();
  view.destroy();
});

test('leaving insert mode and then the editor costs nothing', async () => {
  let hatch = 0;
  const { view, bridge } = mount('one two three', { onEscapeHatch: () => (hatch += 1) });
  await play(view, ['i', 'Escape', 'Escape']);
  assert.equal(snapshot(view).mode, 'normal');
  assert.equal(bridge.count(), 3);
  assert.equal(bridge.wastedCount(), 0, 'a mode change is not waste; the hatch is not waste');
  assert.equal(hatch, 1, 'the second Esc, with nothing pending, releases the editor');
  assert.deepEqual(marks(bridge), ['i', '<Esc>', '<Esc> hatch']);
  bridge.destroy();
  view.destroy();
});

test('a motion that moves nothing is the one kind of key that is wasted', async () => {
  const { view, bridge } = mount('one two three\nlast line');
  await play(view, ['h', 'j', 'j', 'j']);
  assert.equal(bridge.count(), 4);
  assert.equal(bridge.wastedCount(), 2);
  assert.deepEqual(marks(bridge), ['h wasted', 'j', 'j', 'j wasted']);
  bridge.destroy();
  view.destroy();
});

test('a count prefix is pending, not wasted', async () => {
  const { view, bridge } = mount('one two three\nlast line');
  await play(view, ['3', 'w']);
  assert.deepEqual(snapshot(view).cursor, { line: 1, ch: 0 });
  assert.equal(bridge.count(), 2);
  assert.equal(bridge.wastedCount(), 0);
  assert.deepEqual(marks(bridge), ['3 pending', 'w']);
  bridge.destroy();
  view.destroy();
});

test('a yank moves neither the document nor the cursor, and is still not waste', async () => {
  const { view, bridge } = mount('one two three');
  await play(view, ['y', 'y']);
  assert.equal(snapshot(view).doc, 'one two three', 'nothing was edited');
  assert.deepEqual(snapshot(view).cursor, { line: 0, ch: 0 }, 'and nothing moved');
  assert.equal(get(snapshot(view).registers, '"'), 'one two three\n', 'but a register changed');
  assert.equal(bridge.wastedCount(), 0);
  assert.deepEqual(marks(bridge), ['y pending', 'y']);
  bridge.destroy();
  view.destroy();
});

test('a yank notice is not a prompt, so Esc still releases the editor', async () => {
  let hatch = 0;
  const { view, bridge } = mount('one two three', { onEscapeHatch: () => (hatch += 1) });
  await play(view, ['y', 'y']);
  assert.ok(view.dom.querySelector('.cm-vim-panel'), 'the notice panel is on screen');
  assert.equal(view.dom.querySelector('.cm-vim-panel input'), null, 'with nothing to type into');
  await play(view, ['Escape']);
  assert.equal(hatch, 1, 'the hatch fired rather than being spent closing a notice');
  bridge.destroy();
  view.destroy();
});

test('C-r in insert mode pastes the register rather than typing its name', async () => {
  const doc = 'habit\nlabel: ';
  const view = createEditor(doc, 'text');
  resetExercise(view, { doc, cursor: { line: 0, ch: 0 } });

  feedKeys(view, '"ayiwjA<C-r>a<Esc>');
  assert.equal(snapshot(view).doc, 'habit\nlabel: habit');
  assert.equal(snapshot(view).mode, 'normal');
  view.destroy();
});

test('C-r pastes the yank register too, and a half-typed one inserts nothing', async () => {
  const doc = 'habit\nlabel: ';
  const view = createEditor(doc, 'text');

  resetExercise(view, { doc, cursor: { line: 0, ch: 0 } });
  feedKeys(view, 'yiwjA<C-r>0<Esc>');
  assert.equal(snapshot(view).doc, 'habit\nlabel: habit', '"0 is the last yank');

  resetExercise(view, { doc, cursor: { line: 1, ch: 7 } });
  feedKeys(view, 'A<C-r>');
  assert.equal(snapshot(view).doc, doc, 'a half-typed command inserts nothing');
  view.destroy();
});
