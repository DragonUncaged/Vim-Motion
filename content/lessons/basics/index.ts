import type { Lesson } from '../../types';
import { lesson as modes } from './modes';
import { lesson as hjkl } from './hjkl';
import { lesson as words } from './words';
import { lesson as insertMode } from './insert-mode';
import { lesson as lineInsert } from './line-insert';
import { lesson as openLines } from './open-lines';
import { lesson as smallEdits } from './small-edits';
import { lesson as bigWords } from './big-words';
import { lesson as lineEnds } from './line-ends';

export const lessons: Lesson[] = [
  modes,
  hjkl,
  words,
  insertMode,
  lineInsert,
  openLines,
  smallEdits,
  bigWords,
  lineEnds,
];
