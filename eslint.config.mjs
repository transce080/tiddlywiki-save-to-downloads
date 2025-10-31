import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import json from '@eslint/json'

const IGNORED_NUMBERS = [-1, 0, 1]
const INDENT_LENGTH = 2

const ignorePaths = [
  '**/.git/**',
  '**/.vscode-test/**',
  '**/node_modules/**',
  '**/package-lock.json'
]

const javaScriptLanguageOptions = {
  globals: {
    ...globals.browser,
    ...globals.builtin,
    ...globals.mocha,
    ...globals.node
  },
  parserOptions: {
    ecmaFeatures: { jsx: true }
  }
}

const javascriptRules = {
  'camelcase': 'off',
  'capitalized-comments': 'off',
  'comma-dangle': ['warn', 'never'],
  'curly': ['off', 'multi-or-nest', 'consistent'],
  'default-case': 'off',
  'eqeqeq': 'off',
  'func-names': 'off',
  'func-style': 'off',
  'id-length': 'off',
  'indent': ['error', INDENT_LENGTH, { 'SwitchCase': 1 }],
  'init-declarations': 'warn',
  'max-lines-per-function': 'off',
  'max-statements': 'warn',
  'no-alert': 'warn',
  'no-console': 'warn',
  'no-empty-function': 'warn',
  'no-extend-native': 'warn',
  'no-global-assign': 'warn',
  'no-implicit-globals': 'off',
  'no-inline-comments': 'off',
  'no-magic-numbers': ['warn', {
    'ignore': IGNORED_NUMBERS,
    'ignoreDefaultValues': true
  }],
  'no-plusplus': 'off',
  'no-shadow': 'warn',
  'no-ternary': 'off',
  'no-undefined': 'warn',
  'no-underscore-dangle': 'off',
  'no-unexpected-multiline': 'warn',
  'no-use-before-define': 'off',
  'no-var': 'error',
  'no-warning-comments': ['warn', { 'terms': ['bug', 'bugged', 'fixme', 'hack', 'hacked', 'todo'] }],
  'object-shorthand': ['error', 'always'],
  'one-var': 'off',
  'prefer-arrow-callback': 'warn',
  'prefer-named-capture-group': 'off',
  'prefer-template': 'warn',
  'quotes': ['warn', 'single', { 'avoidEscape': true }],
  'radix': 'off',
  'semi': ['warn', 'never'],
  'sort-keys': ['error', 'asc', { 'caseSensitive': false, 'natural': true }],
  'strict': ['error', 'safe'],
  'vars-on-top': 'off'
}

const jsonRules = {
  'json/sort-keys': ['error', 'asc', { 'caseSensitive': false, 'natural': true }],
  'json/top-level-interop': 'warn'
}

const testRules = {
  'init-declarations': 'off',
  'max-statements': 'off',
  'no-console': 'off',
  'no-magic-numbers': 'off'
}

export default defineConfig([
  globalIgnores(ignorePaths),
  {
    // JavaScript defaults
    extends: ['js/all'],
    files: ['*.{js,cjs,mjs}', '**/*.{js,cjs,mjs}'],
    languageOptions: javaScriptLanguageOptions,
    plugins: { js },
    rules: javascriptRules
  },
  {
    // JavaScript commonjs
    files: ['*.{js,cjs}', '**/*.{js,cjs}'],
    languageOptions: {
      ...javaScriptLanguageOptions,
      sourceType: 'commonjs'
    }
  },
  {
    // JavaScript module
    files: ['*.mjs', '**/*.mjs'],
    languageOptions: {
      ...javaScriptLanguageOptions,
      sourceType: 'module'
    }
  },
  {
    // Tests
    files: ['**/*.{spec,test}.{js,cjs,mjs}', '**/tests?/**/*.{js,cjs,mjs}'],
    rules: { ...javascriptRules, ...testRules }
  },
  {
    // JSON
    extends: ['json/recommended'],
    files: ['*.json', '**/*.json'],
    language: 'json/json',
    plugins: { json },
    rules: jsonRules
  },
  {
    // JSON with comments
    extends: ['json/recommended'],
    files: ['**/.vscode/*.json', '*.{code-workspace,jsonc}', '**/*.{code-workspace,jsonc}', '**/Code/User/settings.json'],
    language: 'json/jsonc',
    plugins: { json },
    rules: jsonRules
  }
])