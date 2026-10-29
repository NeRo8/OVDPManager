// Shared by Local03, Tokomni, Oncall, OVDPManager and expo-linphone-module: keep it the same in each.
// A project's eslint.config.js spreads `base`, adds `importOrder()` with its own aliases, then its
// own rules.
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier/flat');

const base = defineConfig([
  expoConfig,
  // Turns off the rules Prettier owns; Prettier runs on its own.
  eslintConfigPrettier,
  {
    settings: {
      // eslint-config-expo's TS overlay drops the TypeScript resolver, which is what maps the
      // aliases from tsconfig paths.
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: './tsconfig.json' },
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // TypeScript already checks what a module exports; these only repeat it, slower and with
      // false positives on packages whose types and code are laid out differently.
      'import/named': 'off',
      'import/namespace': 'off',
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Config files Node loads as CommonJS.
    files: ['*.config.js'],
    languageOptions: { globals: { __dirname: 'readonly', process: 'readonly' } },
  },
  globalIgnores([
    // Native projects and their build output
    'android/',
    'ios/',
    'modules/*/android/',
    'modules/*/ios/',
    // Written by Expo CLI: typed routes and expo-env.d.ts
    '.expo/',
    'expo-env.d.ts',
    'dist/',
    'coverage/',
    // Agent skills: third-party, with their own example code
    '.claude/',
    '.agents/',
  ]),
]);

/**
 * `import/order`: React first, then packages, then the project's aliases in the order given (each
 * `{ pattern, group: 'internal', position? }`), then relative imports; a blank line between groups,
 * alphabetical inside each.
 */
function importOrder(aliases) {
  return {
    rules: {
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            { pattern: '{react,react-native}', group: 'builtin', position: 'before' },
            ...aliases,
          ],
          pathGroupsExcludedImportTypes: [],
          distinctGroup: true,
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  };
}

module.exports = { base, importOrder };
