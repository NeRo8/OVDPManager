import { useKeyRateStore } from './store';
import type { KeyRateState, KeyRateYear } from './types';

/**
 * The rate on `date` from the saved years, or null while its year has not loaded. A date past the
 * year's last saved day, today before NBU publishes it, takes that day's rate.
 */
export function keyRateOn(byYear: KeyRateState['byYear'], date: string): number | null {
  const year = byYear[date.slice(0, 4)];
  if (!year) return null;
  return (
    year.rates[date] ?? (date > year.throughDate ? year.rates[year.throughDate] : null) ?? null
  );
}

export function useCachedKeyRate(date: string): number | null {
  return useKeyRateStore((state) => keyRateOn(state.byYear, date));
}

/** Every year loaded so far, for reading the rate on many dates with `keyRateOn`. */
export function useCachedKeyRateYears(): KeyRateState['byYear'] {
  return useKeyRateStore((state) => state.byYear);
}

export function getCachedKeyRateYear(year: number): KeyRateYear | undefined {
  return useKeyRateStore.getState().byYear[year];
}
