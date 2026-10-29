import type { KnipConfig } from 'knip';

/** Dead-code and dependency audit, run by `yarn validate`. */
const config: KnipConfig = {
  // Read by tools rather than imported: the config plugin listed in app.json, Steiger and EAS
  // Metadata (`submit.production.ios.metadataPath`).
  entry: ['plugins/*.js', 'steiger.config.ts', 'store.config.js'],
  ignoreDependencies: [
    // Knip's Expo plugin expects it unless app.json turns updates off; the app has no OTA updates
    // and doesn't install it.
    'expo-updates',
  ],
  // A store's `initialState` and a model's result types are exported as part of its shape; only
  // exports nothing uses, inside the file or out, are reported.
  ignoreExportsUsedInFile: true,
};

export default config;
