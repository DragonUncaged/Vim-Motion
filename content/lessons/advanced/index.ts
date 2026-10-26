import type { Lesson } from '../../types';
import { lesson as registers } from './registers';
import { lesson as macroWorkflows } from './macro-workflows';
import { lesson as substitute } from './substitute';
import { lesson as globalCommand } from './global-command';
import { lesson as dotAtScale } from './dot-at-scale';

export const lessons: Lesson[] = [registers, macroWorkflows, substitute, globalCommand, dotAtScale];
