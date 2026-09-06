/** Type-only CodeMirror imports: scripts/jsdom-editor.ts loads this before it installs a DOM. */

import type { Extension } from '@codemirror/state';
import type { LessonLanguage } from '@/content/types';

type HighlightedLanguage = Exclude<LessonLanguage, 'text'>;

const LOADERS: Record<HighlightedLanguage, () => Promise<Extension>> = {
  tsx: () =>
    import('@codemirror/lang-javascript').then((m) =>
      m.javascript({ jsx: true, typescript: true }),
    ),
  go: () => import('@codemirror/lang-go').then((m) => m.go()),
  cpp: () => import('@codemirror/lang-cpp').then((m) => m.cpp()),
};

const loaded = new Map<HighlightedLanguage, Extension>();

export const HIGHLIGHTED_LANGUAGES = Object.keys(LOADERS) as HighlightedLanguage[];

export function cachedLanguage(language: LessonLanguage): Extension | null {
  return language === 'text' ? null : (loaded.get(language) ?? null);
}

export async function loadLanguage(language: LessonLanguage): Promise<Extension | null> {
  const cached = cachedLanguage(language);
  if (cached || language === 'text') return cached;
  const extension = await LOADERS[language]();
  loaded.set(language, extension);
  return extension;
}
