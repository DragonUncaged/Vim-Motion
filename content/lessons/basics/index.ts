import type { Lesson } from '../../types';
import { lesson as modes } from './modes';
import { lesson as hjkl } from './hjkl';
import { lesson as words } from './words';

export const lessons: Lesson[] = [modes, hjkl, words];
