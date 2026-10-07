import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';
const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        __NAME__: 'readonly',
        __VERSION__: 'readonly',
        __SVELTE_VERSION__: 'readonly',
        __SVELTEKIT_VERSION__: 'readonly',
        __VITE_VERSION__: 'readonly'
      }
    }
  },
  {
    files: ['src/**/*.{ts,js,svelte}'],
    rules: {
      // Progress is keyed by vocabKey(entry) (the entry id), never by `norsk`: sibling
      // senses share a `norsk`, so a `norsk` key merges their cards. See
      // ai-docs/implementation/vocab-multiple-senses.md (Phase 4) and
      // data-rules/vocab-and-uttrykk.md. A deliberate, non-progress use (e.g. grouping
      // for display) can opt out with a line-level disable and a reason.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[computed=true] > MemberExpression.property[property.name='norsk']",
          message:
            'Do not key by `.norsk` (sibling senses share it). Use vocabKey(entry) from $lib/progress.'
        },
        {
          selector:
            "MemberExpression[computed=true] > ChainExpression.property > MemberExpression[property.name='norsk']",
          message:
            'Do not key by `.norsk` (sibling senses share it). Use vocabKey(entry) from $lib/progress.'
        }
      ]
    }
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    ignores: ['eslint.config.js', 'svelte.config.js'],

    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        svelteConfig
      }
    },
    rules: {
      'svelte/no-navigation-without-resolve': ['error', { ignoreLinks: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }
      ]
    }
  }
);
