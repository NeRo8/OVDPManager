const { defineConfig } = require('eslint/config');

const { base, importOrder } = require('./eslint.base');

module.exports = defineConfig([
  ...base,
  // The FSD layers, highest first — the order they may import each other in (Steiger checks the
  // direction, this only sorts).
  importOrder([
    { pattern: '@/app{,/**}', group: 'internal', position: 'before' },
    { pattern: '@/pages/**', group: 'internal', position: 'before' },
    { pattern: '@/features/**', group: 'internal', position: 'before' },
    { pattern: '@/entities/**', group: 'internal', position: 'before' },
    { pattern: '@/shared/**', group: 'internal' },
  ]),
]);
