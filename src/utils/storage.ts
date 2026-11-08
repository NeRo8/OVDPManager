import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

const mmkv = createMMKV();
const PORTFOLIO_KEYS = ['holdings-v1', 'investment-plan-v1'] as const;
const JOURNAL_KEY = 'portfolio-update-journal-v1';

function recoverPortfolioUpdate(): void {
  const journal = mmkv.getString(JOURNAL_KEY);
  if (!journal) return;
  const previous = JSON.parse(journal) as Record<string, string | null>;
  for (const key of PORTFOLIO_KEYS) {
    if (previous[key] === null) mmkv.remove(key);
    else mmkv.set(key, previous[key]);
  }
  mmkv.remove(JOURNAL_KEY);
}

recoverPortfolioUpdate();

/** Restore both persisted stores on the next launch if an update is interrupted. */
export function portfolioUpdate(update: () => void): void {
  const previous = Object.fromEntries(
    PORTFOLIO_KEYS.map((key) => [key, mmkv.getString(key) ?? null]),
  );
  mmkv.set(JOURNAL_KEY, JSON.stringify(previous));
  try {
    update();
    mmkv.remove(JOURNAL_KEY);
  } catch (error) {
    recoverPortfolioUpdate();
    throw error;
  }
}

/** Synchronous storage lets Zustand hydrate before the first screen renders. */
export const mmkvStorage: StateStorage = {
  getItem: (key) => mmkv.getString(key) ?? null,
  setItem: (key, value) => {
    mmkv.set(key, value);
  },
  removeItem: (key) => {
    mmkv.remove(key);
  },
};
