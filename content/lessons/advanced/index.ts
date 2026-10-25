import type { Lesson } from '../../types';
import { lesson as registers } from './registers';
import { lesson as macroWorkflows } from './macro-workflows';

export const lessons: Lesson[] = [registers, macroWorkflows];
