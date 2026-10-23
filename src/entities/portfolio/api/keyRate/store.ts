import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/shared/lib';
import type { KeyRateState } from './types';

const STORAGE_KEY = 'nbu-key-rate-v1';

export const initialState: KeyRateState = { rate: null, updatedAt: null };

/** The last NBU key policy rate. */
export const useKeyRateStore = create<KeyRateState>()(
  persist(() => initialState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => mmkvStorage),
  }),
);
