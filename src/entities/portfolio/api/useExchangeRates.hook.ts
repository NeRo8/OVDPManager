import { useQueries } from '@tanstack/react-query';

import { todayISO } from '@/shared/lib';

import { useCachedExchangeRateYears } from './exchangeRate';
import { exchangeRateQuery } from './exchangeRateQuery';
import type { ExchangeCurrency } from './nbuExchangeRates';

/** Official hryvnia per foreign currency unit on every requested past date. */
export function useExchangeRates(currency: ExchangeCurrency, dates: string[]) {
  const cached = useCachedExchangeRateYears();
  const years = [...new Set(dates.map((date) => Number(date.slice(0, 4))))];
  const queries = useQueries({ queries: years.map((year) => exchangeRateQuery(currency, year)) });
  const today = todayISO();
  const todayYear = Number(today.slice(0, 4));
  const todayQuery = queries[years.indexOf(todayYear)];
  const todayRate = cached[`${currency}-${todayYear}`]?.rates[today];
  const latest = Object.entries(cached)
    .filter(([key, value]) => key.startsWith(`${currency}-`) && value.throughDate < today)
    .map(([, value]) => value)
    .sort((a, b) => b.throughDate.localeCompare(a.throughDate))[0];
  const fallbackDate =
    dates.includes(today) &&
    todayRate === undefined &&
    todayQuery?.isError &&
    latest &&
    latest.rates[latest.throughDate] !== undefined
      ? latest.throughDate
      : null;
  return {
    rateOn: (date: string) =>
      cached[`${currency}-${date.slice(0, 4)}`]?.rates[date] ??
      (date === today && fallbackDate ? latest?.rates[fallbackDate] : null) ??
      null,
    fallbackDate,
    loading: queries.some((query) => query.isPending),
    error: queries.find((query) => query.isError)?.error?.message ?? null,
    retry: async () => {
      await Promise.all(queries.map((query) => query.refetch()));
    },
  };
}
