import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import svelteConfig from './svelte.config.js';

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        svelteConfig,
      },
    },
  },
  {
    rules: {
      // The app is a single route with no client-side navigation; every <a href>
      // in it points at external documentation, which resolve() does not apply to.
      'svelte/no-navigation-without-resolve': 'off',
    },
  },
  {
    ignores: ['build/', '.svelte-kit/', 'dist/', 'node_modules/', 'artifacts/', 'schema/', 'docs/'],
  },
);
