import Storage from 'expo-sqlite/kv-store';

import type { SyncStringStorage } from './persistedStorage';

/** Synchronous storage lets Zustand hydrate before the first screen renders. */
export const sqliteStorage: SyncStringStorage = {
  getItem: (key) => Storage.getItemSync(key),
  setItem: (key, value) => {
    Storage.setItemSync(key, value);
  },
  removeItem: (key) => {
    Storage.removeItemSync(key);
  },
};
