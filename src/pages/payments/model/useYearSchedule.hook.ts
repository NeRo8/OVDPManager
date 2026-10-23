import { useState } from 'react';

import { CURRENCIES, type Currency, type ScheduleEvent } from '@/entities/portfolio';
import { filterSchedule } from '@/features/payment-filters';
import { useOptionChoice } from '@/shared/lib';
import { groupScheduleEventsByMonth } from './scheduleSections';
import type { FilteredWallet } from './useFilteredWallet.hook';
import { yearSummary } from './yearSummary';

const yearOf = (event: ScheduleEvent) => Number(event.date.slice(0, 4));

/**
 * One year of the filtered wallet and what the screen has picked in it: the year, the currency of
 * the chart and the month spelled out under it.
 */
export function useYearSchedule({ wallet, filters }: FilteredWallet) {
  const currentYear = Number(wallet.today.slice(0, 4));
  const { events } = filterSchedule(wallet, filters, 'years');
  const years = events.map(yearOf);
  const firstYear = years.length ? Math.min(...years) : currentYear;
  const lastYear = years.length ? Math.max(...years) : currentYear;

  const [chosenYear, setYear] = useState<number | null>(null);
  const year = chosenYear ?? Math.min(Math.max(currentYear, firstYear), lastYear);
  const yearEvents = events.filter((event) => yearOf(event) === year);

  const currencies = [...new Set(yearEvents.map((event) => event.currency))]
    .filter((currency): currency is Currency => currency !== null)
    .sort((a, b) => CURRENCIES.indexOf(a) - CURRENCIES.indexOf(b));
  // The chart has one money scale, so a year in several currencies shows one at a time.
  const [currency, setCurrency] = useOptionChoice(currencies);
  const summary = currency ? yearSummary(yearEvents, currency) : null;

  const [chosenMonth, setChosenMonth] = useState<{ year: number; month: number } | null>(null);
  const month = chosenMonth?.year === year ? chosenMonth.month : (summary?.defaultMonth ?? null);
  const setMonth = (month: number) => setChosenMonth({ year, month });

  // Purchases of an unknown currency are listed under every currency, as they may be in any.
  const sections = groupScheduleEventsByMonth(
    yearEvents.filter((event) => event.currency === currency || event.currency === null),
  );

  return {
    firstYear,
    lastYear,
    year,
    setYear,
    currencies,
    currency,
    setCurrency,
    summary,
    month,
    setMonth,
    sections,
  };
}
