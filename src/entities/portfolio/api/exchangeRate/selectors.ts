import { useExchangeRateStore } from './store';

export function useCachedExchangeRateYears() {
  return useExchangeRateStore((state) => state.byCurrencyYear);
}

export function getCachedExchangeRateYear(key: string) {
  return useExchangeRateStore.getState().byCurrencyYear[key];
}
