/** No value import of CodeMirror: HelpPanel reads these without pulling in the editor. */

import type { ClayHue } from '@/components/clay/Key';
import type { EditorMode } from '@/content/types';

/** docs/CONTRACT.md §2. */
export const MODE_HUE: Record<EditorMode, ClayHue> = {
  normal: 'blue',
  insert: 'mint',
  visual: 'butter',
  'visual-line': 'butter',
  'visual-block': 'butter',
  replace: 'coral',
};

export const MODE_LABEL: Record<EditorMode, string> = {
  normal: 'NORMAL',
  insert: 'INSERT',
  visual: 'VISUAL',
  'visual-line': 'VISUAL LINE',
  'visual-block': 'VISUAL BLOCK',
  replace: 'REPLACE',
};

export const MODE_FAMILY: Record<EditorMode, 'normal' | 'insert' | 'visual' | 'replace'> = {
  normal: 'normal',
  insert: 'insert',
  visual: 'visual',
  'visual-line': 'visual',
  'visual-block': 'visual',
  replace: 'replace',
};
