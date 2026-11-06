import { useExchangeRateStore } from './store';

export function getCachedExchangeRateYear(key: string) {
  return useExchangeRateStore.getState().byCurrencyYear[key];
}
