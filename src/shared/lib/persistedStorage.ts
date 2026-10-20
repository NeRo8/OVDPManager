import type { PersistStorage, StorageValue } from 'zustand/middleware';

export type SyncStringStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

type Decoder<State> = (value: unknown) => State | null;

/** Reads both Zustand envelopes and the raw JSON saved by earlier app versions. */
export function createPersistStorage<State>(
  storage: SyncStringStorage,
  decodeState: Decoder<State>,
  decodeLegacy: Decoder<State> = decodeState,
): PersistStorage<State> {
  return {
    getItem(name): StorageValue<State> | null {
      try {
        const raw = storage.getItem(name);
        if (raw === null) return null;

        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null && 'state' in parsed) {
          if (!('version' in parsed) || parsed.version !== 1) return null;
          const state = decodeState(parsed.state);
          return state === null ? null : { state, version: 1 };
        }

        const state = decodeLegacy(parsed);
        return state === null ? null : { state, version: 1 };
      } catch {
        return null;
      }
    },
    setItem(name, value) {
      storage.setItem(name, JSON.stringify(value));
    },
    removeItem(name) {
      storage.removeItem(name);
    },
  };
}
