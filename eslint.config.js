const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  globalIgnores(['.expo/*', 'dist/*', 'web-build/*']),
  expoConfig,
  prettierConfig,
]);
