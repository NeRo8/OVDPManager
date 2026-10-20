import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Each flow has one screen as its entry point, but keeps actions out of page UI.
    files: ['./src/features/**'],
    rules: { 'fsd/insignificant-slice': 'off' },
  },
  {
    // Native icon assets are addressed by app.json, not imported from TypeScript.
    files: ['./src/shared/config/**'],
    rules: { 'fsd/public-api': 'off' },
  },
]);
