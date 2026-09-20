import type { Lesson } from '../../types';
import { lesson as tsxStrings } from './tsx-strings';
import { lesson as tsxBraces } from './tsx-braces';
import { lesson as tsxHooks } from './tsx-hooks';
import { lesson as tsxBlocks } from './tsx-blocks';
import { lesson as tsxTags } from './tsx-tags';
import { lesson as tsxRefactor } from './tsx-refactor';

export const lessons: Lesson[] = [tsxStrings, tsxBraces, tsxHooks, tsxBlocks, tsxTags, tsxRefactor];
