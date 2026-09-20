import type { Lesson } from '../../types';
import { lesson as cppMatch } from './cpp-match';
import { lesson as cppScopes } from './cpp-scopes';
import { lesson as cppTemplates } from './cpp-templates';
import { lesson as cppIncludes } from './cpp-includes';
import { lesson as cppBlock } from './cpp-block';

export const lessons: Lesson[] = [cppMatch, cppScopes, cppTemplates, cppIncludes, cppBlock];
