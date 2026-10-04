import { dirname } from 'path';
import { fileURLToPath } from 'url';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ESLint replaces a rule's options outright, so every no-restricted-imports entry must restate these.
const RESTRICTED_IMPORTS = {
  paths: [
    {
      name: '@codemirror/commands',
      importNames: ['defaultKeymap'],
      message:
        'defaultKeymap binds emacs keys on macOS — Ctrl-k wipes to end of line while the ' +
        'learner is in insert mode, and Ctrl-a/Ctrl-e fight vim. The editor builds its ' +
        'keymap explicitly in components/editor/VimEditor.tsx. Import history() from here; ' +
        'not the keymap.',
    },
    {
      name: 'codemirror',
      message:
        'The `codemirror` meta-package pulls in basicSetup, which bundles defaultKeymap ' +
        'and its macOS emacs bindings (Ctrl-k wipes to end of line in insert mode). ' +
        'Import the individual @codemirror/* packages the editor actually needs.',
    },
  ],
  patterns: [
    {
      group: ['**/vim-engine', '**/vim-engine.js', '**/design-source/**'],
      message:
        'The reference vim-engine must never reach the app. It has no block visual, no ' +
        'Ctrl-r, no marks, no named registers and no macros, and it does not fail on them: ' +
        'it falls through to a same-letter command and types the rest of the sequence into ' +
        'the buffer as literal text. The shipped editor is lib/engine/vim-bridge.ts.',
    },
  ],
};

const NO_PARENT_RELATIVE = {
  group: ['../*', '../../**'],
  message:
    'Use `./` for a file in the same directory and `@/` for everything else. A ' +
    '`../` specifier says how far away a module is rather than where it lives, and it ' +
    'has to be rewritten every time either file moves.',
};

const NO_DISTANT_PARENT_RELATIVE = {
  group: ['../../**'],
  message:
    'A test may import the module it tests as `../thing.ts`. Anything further away ' +
    'takes `@/` — see NO_PARENT_RELATIVE in eslint.config.mjs.',
};

const NO_COMPONENTS_FROM_LIB = {
  group: ['@/components/*', '**/components/*'],
  message:
    'lib/ must not depend on components/. Move the type or the pure function down — into ' +
    "content/types.ts if it is a token, lib/engine/types.ts if it is part of the engine's " +
    'contract, or its own module under lib/.',
};

const restrictedImports = (...extra) => [
  'error',
  { ...RESTRICTED_IMPORTS, patterns: [...RESTRICTED_IMPORTS.patterns, ...extra] },
];

const eslintConfig = [
  { ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'node_modules/**'] },

  ...nextCoreWebVitals,
  ...nextTypeScript,

  // Not 'detect': that path calls context.getFilename(), which ESLint 10 removed.
  { settings: { react: { version: '19.0' } } },

  // Off until fixed: set-state-in-effect wants useSyncExternalStore over cached lib/progress snapshots,
  // and refs wants useEffectEvent, still experimental in React 19.2.
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
    },
  },

  // Borrows the rules, not the flat config: next/core-web-vitals already registers jsx-a11y and redefining a plugin is an error.
  {
    files: ['**/*.{jsx,tsx}'],
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // `autoFocus` is the editor's own prop (docs/CONTRACT.md §11); a literal `<input autoFocus>` is still an error.
      'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
    },
  },

  {
    files: ['lib/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { projectService: true, tsconfigRootDir: __dirname },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-deprecated': 'error',
    },
  },

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parser: tseslint.parser },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },

  {
    files: ['**/*.{ts,tsx,mts,mjs,js}'],
    rules: {
      'react-hooks/exhaustive-deps': 'error',
      'react/no-unstable-nested-components': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },

  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
          message:
            'dangerouslySetInnerHTML is banned (docs/CONTRACT.md §5). Lesson prose is ' +
            'untrusted-shaped string data rendered by components/prose/RichText.tsx, which ' +
            'exists precisely so raw ' +
            'HTML is never needed. Add a construct to the RichText parser instead.',
        },
        {
          selector: 'Property[key.name="dangerouslySetInnerHTML"]',
          message:
            'dangerouslySetInnerHTML is banned (docs/CONTRACT.md §5). Render through ' +
            'components/prose/RichText.tsx instead of injecting HTML.',
        },
      ],
      'no-restricted-imports': restrictedImports(),
    },
  },

  {
    files: ['components/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': restrictedImports(NO_PARENT_RELATIVE) },
  },
  {
    files: ['lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictedImports(NO_COMPONENTS_FROM_LIB, NO_PARENT_RELATIVE),
    },
  },
  {
    files: ['lib/**/__tests__/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictedImports(
        NO_COMPONENTS_FROM_LIB,
        NO_DISTANT_PARENT_RELATIVE,
      ),
    },
  },
  {
    files: ['components/**/__tests__/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': restrictedImports(NO_DISTANT_PARENT_RELATIVE) },
  },

  {
    files: ['scripts/**/*.{mjs,ts}'],
    rules: { 'no-console': 'off' },
  },

  {
    files: ['**/__tests__/**/*.{ts,tsx}'],
    rules: { '@typescript-eslint/no-floating-promises': 'off' },
  },

  // Last, always: turns off every stylistic rule Prettier owns.
  prettier,
];

export default eslintConfig;
