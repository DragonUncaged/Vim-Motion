import test from 'node:test';
import assert from 'node:assert/strict';

import { HIGHLIGHTED_LANGUAGES, cachedLanguage, loadLanguage } from '../languages.ts';
import { allLessons } from '@/content/lessons/index.ts';

test('every language the curriculum declares can be loaded', () => {
  const declared = new Set(allLessons.map((lesson) => lesson.language));
  for (const language of declared) {
    if (language === 'text') continue;
    assert.ok(
      HIGHLIGHTED_LANGUAGES.includes(language),
      `lesson language ${language} has no loader in components/editor/languages.ts`,
    );
  }
  for (const language of HIGHLIGHTED_LANGUAGES) {
    assert.ok(declared.has(language), `no lesson uses ${language}; drop its loader`);
  }
});

test('text has no parser to fetch, before or after a load', async () => {
  assert.equal(cachedLanguage('text'), null);
  assert.equal(await loadLanguage('text'), null);
});

test('a mode is null until loaded, then cached by identity', async () => {
  for (const language of HIGHLIGHTED_LANGUAGES) {
    assert.equal(cachedLanguage(language), null, `${language} was cached before any load`);
    const first = await loadLanguage(language);
    assert.ok(first, `${language} resolved no extension`);
    assert.equal(cachedLanguage(language), first, `${language} was not cached`);
    assert.equal(await loadLanguage(language), first, `${language} reloaded a second time`);
  }
});
