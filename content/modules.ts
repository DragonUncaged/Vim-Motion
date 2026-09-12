import type { Module } from './types';

export const modules: Module[] = [
  {
    id: 'basics',
    name: 'Basic vim',
    order: 1,
    blurb: 'Modes, hjkl, words and lines.',
    accent: 'blue',
  },
  {
    id: 'operators',
    name: 'Operators and text objects',
    order: 2,
    blurb: 'Verb plus noun. Learn the grammar once.',
    accent: 'violet',
  },
];
