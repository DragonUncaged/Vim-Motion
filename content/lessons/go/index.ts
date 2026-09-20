import type { Lesson } from '../../types';
import { lesson as goErrs } from './go-errs';
import { lesson as goStructs } from './go-structs';
import { lesson as goNav } from './go-nav';
import { lesson as goArgs } from './go-args';
import { lesson as goBlock } from './go-block';

export const lessons: Lesson[] = [goErrs, goStructs, goNav, goArgs, goBlock];
