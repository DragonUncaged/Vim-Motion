import type { Lesson } from '../../types';
import { lesson as cppMatch } from './cpp-match';
import { lesson as cppScopes } from './cpp-scopes';

export const lessons: Lesson[] = [cppMatch, cppScopes];
