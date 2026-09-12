import type { Lesson } from '../../types';
import { lesson as deleteLesson } from './delete';
import { lesson as change } from './change';
import { lesson as yankPut } from './yank-put';
import { lesson as counts } from './counts';
import { lesson as jumps } from './jumps';
import { lesson as scrolling } from './scrolling';

export const lessons: Lesson[] = [deleteLesson, change, yankPut, counts, jumps, scrolling];
