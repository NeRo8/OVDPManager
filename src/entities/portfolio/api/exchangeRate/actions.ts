import { useExchangeRateStore } from './store';
import type { ExchangeRateYear } from './types';

export function saveExchangeRateYear(key: string, year: ExchangeRateYear): void {
  useExchangeRateStore.setState((state) => ({
    byCurrencyYear: { ...state.byCurrencyYear, [key]: year },
  }));
}
