import type { Lesson } from '../../types';
import { lesson as registers } from './registers';
import { lesson as macroWorkflows } from './macro-workflows';
import { lesson as substitute } from './substitute';
import { lesson as globalCommand } from './global-command';

export const lessons: Lesson[] = [registers, macroWorkflows, substitute, globalCommand];
