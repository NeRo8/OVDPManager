import { useExchangeRateStore } from './store';
import type { ExchangeRateYear } from './types';

export function saveExchangeRateYear(key: string, value: ExchangeRateYear): void {
  useExchangeRateStore.setState((state) => ({
    byCurrencyYear: { ...state.byCurrencyYear, [key]: value },
  }));
}
