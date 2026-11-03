import { useKeyRateStore } from './store';
import type { KeyRateYear } from './types';

export function saveKeyRateYear(year: number, rates: KeyRateYear): void {
  useKeyRateStore.setState((state) => ({
    byYear: { ...state.byYear, [year]: rates },
  }));
}
