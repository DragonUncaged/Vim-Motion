import type { Lesson } from '../../types';
import { lesson as deleteLesson } from './delete';
import { lesson as change } from './change';
import { lesson as yankPut } from './yank-put';

export const lessons: Lesson[] = [deleteLesson, change, yankPut];
