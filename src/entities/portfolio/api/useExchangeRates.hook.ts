import { useQueries } from '@tanstack/react-query';

import { useCachedExchangeRateYears } from './exchangeRate';
import { exchangeRateQuery } from './exchangeRateQuery';
import type { ExchangeCurrency } from './nbuExchangeRates';

/** Official hryvnia per foreign currency unit on every requested past date. */
export function useExchangeRates(currency: ExchangeCurrency, dates: string[]) {
  const cached = useCachedExchangeRateYears();
  const years = [...new Set(dates.map((date) => Number(date.slice(0, 4))))];
  const queries = useQueries({ queries: years.map((year) => exchangeRateQuery(currency, year)) });
  return {
    rateOn: (date: string) => cached[`${currency}-${date.slice(0, 4)}`]?.rates[date] ?? null,
    loading: queries.some((query) => query.isPending),
    error: queries.find((query) => query.isError)?.error?.message ?? null,
    retry: async () => {
      await Promise.all(queries.map((query) => query.refetch()));
    },
  };
}
