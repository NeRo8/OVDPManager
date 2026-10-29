import { queryOptions } from '@tanstack/react-query';

import { todayISO } from '@/shared/lib';

import { getCachedExchangeRateYear, saveExchangeRateYear } from './exchangeRate';
import { type ExchangeCurrency, fetchExchangeRates } from './nbuExchangeRates';

const STALE_AFTER_MS = 12 * 60 * 60 * 1000;

export function exchangeRateQuery(currency: ExchangeCurrency, year: number) {
  const today = todayISO();
  const throughDate = year === Number(today.slice(0, 4)) ? today : `${year}-12-31`;
  const key = `${currency}-${year}`;
  const cached = getCachedExchangeRateYear(key);
  const complete = cached && cached.throughDate >= throughDate;

  return queryOptions({
    queryKey: ['nbu', 'exchange-rates', currency, year],
    queryFn: async ({ signal }) => {
      const rates = await fetchExchangeRates(currency, year, throughDate, signal);
      saveExchangeRateYear(key, { rates, throughDate, updatedAt: Date.now() });
      return rates;
    },
    staleTime: year < Number(today.slice(0, 4)) ? Infinity : STALE_AFTER_MS,
    initialData: () => (complete ? cached.rates : undefined),
    initialDataUpdatedAt: () => (complete ? cached.updatedAt : undefined),
    meta: { errorTitle: `Не вдалося оновити курс ${currency}` },
  });
}
