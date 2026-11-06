import { queryOptions } from '@tanstack/react-query';

import { getCachedExchangeRateYear, saveExchangeRateYear } from '@/stores/exchangeRate';

import { type ExchangeCurrency, fetchExchangeRates } from './nbuExchangeRates';

export function exchangeRateQuery(currency: ExchangeCurrency, year: number, today: string) {
  const past = year < Number(today.slice(0, 4));
  const throughDate = past ? `${year}-12-31` : today;
  const key = `${currency}-${year}`;
  const cached = getCachedExchangeRateYear(key);
  const complete = cached && cached.throughDate >= throughDate;
  return queryOptions({
    queryKey: ['nbu', 'exchange-rates', currency, year, throughDate],
    queryFn: async ({ signal }) => {
      const rates = await fetchExchangeRates(currency, year, throughDate, signal);
      saveExchangeRateYear(key, { rates, throughDate, updatedAt: Date.now() });
      return rates;
    },
    staleTime: past ? Infinity : 12 * 60 * 60 * 1000,
    initialData: () => (complete ? cached.rates : undefined),
    initialDataUpdatedAt: () => (complete ? cached.updatedAt : undefined),
    meta: { errorTitle: `Не вдалося оновити курс ${currency}` },
  });
}
