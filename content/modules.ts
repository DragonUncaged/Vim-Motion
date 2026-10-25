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
  {
    id: 'react-tsx',
    name: 'React + TypeScript',
    order: 3,
    blurb: 'Real .tsx files: props, hooks and JSX.',
    accent: 'mint',
  },
  {
    id: 'go',
    name: 'Go',
    order: 4,
    blurb: 'Structs, error returns and tab-indented blocks.',
    accent: 'butter',
  },
  {
    id: 'cpp',
    name: 'C++',
    order: 5,
    blurb: 'Templates, namespaces, and deep nesting.',
    accent: 'coral',
  },
  {
    id: 'advanced',
    name: 'Advanced editing',
    order: 6,
    blurb: 'Registers, macros, the global command and the dot, worked past the demo.',
    accent: 'violet',
  },
];
