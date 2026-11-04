import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import importX, { createNodeResolver } from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { localPlugin } from './tools/eslint/localPlugin.mjs';

const forbiddenSyntax = [
  {
    selector: 'TSEnumDeclaration',
    message: 'Use an `as const` object plus a derived union type instead of enum.',
  },
  { selector: 'TSModuleDeclaration', message: 'Namespaces are forbidden. Use ES modules.' },
  {
    selector: 'ClassExpression',
    message: 'Inline classes are forbidden. Declare a top-level class in its own file.',
  },
  {
    selector: 'TSTypeLiteral',
    message: 'Inline object types are forbidden. Declare a named interface.',
  },
  {
    selector: 'TSImportType',
    message: 'Use a top-level `import type` instead of inline import() types.',
  },
  {
    selector: 'ChainExpression',
    message:
      'Optional chaining is forbidden. Handle null explicitly with a guard or a non-null type.',
  },
];

const MAX_LINE_LENGTH = 100;

const layerBoundaries = (patterns) => ({
  'no-restricted-imports': ['error', { patterns }],
});

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', 'packages/client/public/**'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['tools/eslint/*.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.es2023 },
    },
    plugins: { 'import-x': importX, local: localPlugin },
    settings: {
      'import-x/resolver-next': [
        createNodeResolver({ extensions: ['.ts', '.tsx', '.js', '.mjs'] }),
      ],
    },
    rules: {
      'local/no-comments': 'error',
      'local/max-line-length': ['error', { max: MAX_LINE_LENGTH }],
      '@typescript-eslint/prefer-optional-chain': 'off',
      'max-classes-per-file': ['error', 1],
      'no-restricted-syntax': ['error', ...forbiddenSyntax],
      'no-console': 'error',
      'no-param-reassign': 'error',
      'no-nested-ternary': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'prefer-const': 'error',
      'object-shorthand': 'error',
      'import-x/no-cycle': ['error', { maxDepth: 12 }],
      'import-x/no-duplicates': 'error',
      'import-x/no-default-export': 'error',
      'import-x/no-self-import': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true, requireDefaultForNonUnion: true },
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'typeLike', format: ['PascalCase'] },
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: { regex: '^I[A-Z]', match: false },
        },
        {
          selector: 'variable',
          modifiers: ['const', 'global'],
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        },
        {
          selector: 'memberLike',
          modifiers: ['private'],
          format: ['camelCase'],
          leadingUnderscore: 'forbid',
        },
      ],
    },
  },
  {
    files: ['packages/shared/src/**/*.ts'],
    rules: layerBoundaries([
      {
        group: [
          'three',
          'three/*',
          'ws',
          'fastify',
          '@fastify/*',
          'preact',
          'preact/*',
          '@preact/*',
        ],
        message: 'shared must stay platform-agnostic.',
      },
      { group: ['node:*'], message: 'shared must stay platform-agnostic.' },
      {
        group: [
          '@graveshift/server',
          '@graveshift/server/*',
          '@graveshift/client',
          '@graveshift/client/*',
        ],
        message: 'shared is the bottom layer.',
      },
    ]),
  },
  {
    files: ['packages/server/src/{domain,application}/**/*.ts'],
    rules: layerBoundaries([
      {
        group: ['fastify', '@fastify/*', 'ws', '**/infrastructure/**', '**/transport/**'],
        message: 'Domain and application layers must not depend on transport or infrastructure.',
      },
    ]),
  },
  {
    files: ['packages/server/src/domain/**/*.ts'],
    rules: layerBoundaries([
      {
        group: [
          'fastify',
          '@fastify/*',
          'ws',
          '**/infrastructure/**',
          '**/transport/**',
          '**/application/**',
        ],
        message: 'Domain must not depend on outer layers.',
      },
    ]),
  },
  {
    files: ['packages/client/src/{game,net,input,meta,audio}/**/*.{ts,tsx}'],
    rules: layerBoundaries([
      {
        group: ['**/ui/**', 'preact', 'preact/*'],
        message: 'Only the ui layer may depend on the view framework.',
      },
      {
        group: ['**/render/**', 'three', 'three/*'],
        message: 'Game logic must not depend on rendering.',
      },
    ]),
  },
  {
    files: ['packages/client/src/render/**/*.ts'],
    rules: layerBoundaries([
      {
        group: ['**/ui/**', 'preact', 'preact/*', '@preact/*', '**/net/**'],
        message: 'render depends only on game state and assets.',
      },
    ]),
  },
  {
    files: ['packages/server/src/infrastructure/logging/ConsoleLogger.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['**/*.config.{ts,mjs}', 'eslint.config.mjs'],
    rules: { 'import-x/no-default-export': 'off' },
  },
  {
    files: ['**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['**/*.mjs'],
    rules: { '@typescript-eslint/explicit-module-boundary-types': 'off' },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      'max-classes-per-file': 'off',
    },
  },
  prettier,
);
