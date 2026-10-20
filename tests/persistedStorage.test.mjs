import assert from 'node:assert/strict';
import test from 'node:test';

import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';

import { createPersistStorage } from '../src/shared/lib/persistedStorage.ts';

function memoryStorage(initial = []) {
  const items = new Map(initial);
  return {
    items,
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value);
    },
    removeItem: (key) => {
      items.delete(key);
    },
  };
}

function decodeHoldings(value) {
  return value && Array.isArray(value.holdings) ? { holdings: value.holdings } : null;
}

function makeHoldingsStore(storage) {
  return createStore()(
    persist(
      (set) => ({
        holdings: [],
        add: (holding) => set((state) => ({ holdings: [...state.holdings, holding] })),
      }),
      {
        name: 'holdings-v1',
        version: 1,
        storage: createPersistStorage(storage, decodeHoldings, (value) =>
          Array.isArray(value) ? { holdings: value } : null,
        ),
        partialize: ({ holdings }) => ({ holdings }),
      },
    ),
  );
}

test('hydrates legacy purchases and saves them in the Zustand format', () => {
  const first = { id: '1', isin: 'UA123', purchaseDate: '2026-10-20', amount: 1000, quantity: 1 };
  const second = { id: '2', isin: 'UA456', purchaseDate: '2026-10-21', amount: 2000, quantity: 2 };
  const storage = memoryStorage([['holdings-v1', JSON.stringify([first])]]);

  const store = makeHoldingsStore(storage);
  assert.deepEqual(store.getState().holdings, [first]);
  assert.deepEqual(JSON.parse(storage.items.get('holdings-v1')), [first]);

  store.getState().add(second);
  assert.deepEqual(JSON.parse(storage.items.get('holdings-v1')), {
    state: { holdings: [first, second] },
    version: 1,
  });
  assert.deepEqual(makeHoldingsStore(storage).getState().holdings, [first, second]);
});

test('ignores an invalid or unsupported payload without deleting it', () => {
  for (const raw of ['{broken', JSON.stringify({ state: { holdings: [] }, version: 2 })]) {
    const storage = memoryStorage([['holdings-v1', raw]]);
    assert.deepEqual(makeHoldingsStore(storage).getState().holdings, []);
    assert.equal(storage.items.get('holdings-v1'), raw);
  }
});
