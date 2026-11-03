const { defineConfig } = require('eslint/config');

const { base, importOrder } = require('./eslint.base');

module.exports = defineConfig([
  ...base,
  // The app's own modules (`@/components`, `@/stores`…) as one group, after the packages.
  importOrder([{ pattern: '@/**', group: 'internal' }]),
]);
