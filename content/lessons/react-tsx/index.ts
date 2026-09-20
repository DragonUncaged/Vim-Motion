import type { Lesson } from '../../types';
import { lesson as tsxStrings } from './tsx-strings';
import { lesson as tsxBraces } from './tsx-braces';
import { lesson as tsxHooks } from './tsx-hooks';
import { lesson as tsxBlocks } from './tsx-blocks';

export const lessons: Lesson[] = [tsxStrings, tsxBraces, tsxHooks, tsxBlocks];
