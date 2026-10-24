import { useState } from 'react';

import type { ScheduleEvent } from '@/entities/portfolio';
import { SCHEDULE_EVENT_TYPES, filterSchedule } from '@/features/payment-filters';
import { groupScheduleEventsByMonth } from './scheduleSections';
import type { FilteredWallet } from './useFilteredWallet.hook';
import { yearSummary } from './yearSummary';

const yearOf = (event: ScheduleEvent) => Number(event.date.slice(0, 4));
const monthOf = (event: ScheduleEvent) => Number(event.date.slice(5, 7)) - 1;

/**
 * One year of the filtered wallet and what the screen has picked in it: the year and the month
 * whose events are listed under the chart.
 */
export function useYearSchedule({ wallet, filters }: FilteredWallet) {
  const currentYear = Number(wallet.today.slice(0, 4));
  const { events } = filterSchedule(wallet, filters);
  // The chart and the totals show only the types the filters let through.
  const types = filters.types.length > 0 ? filters.types : SCHEDULE_EVENT_TYPES;
  const years = events.map(yearOf);
  const firstYear = years.length ? Math.min(...years) : currentYear;
  const lastYear = years.length ? Math.max(...years) : currentYear;

  const [chosenYear, setYear] = useState<number | null>(null);
  const year = chosenYear ?? Math.min(Math.max(currentYear, firstYear), lastYear);
  const yearEvents = events.filter((event) => yearOf(event) === year);

  // The filters leave one currency, as the chart has one money scale.
  const { currency } = filters;
  const summary = currency && yearEvents.length > 0 ? yearSummary(yearEvents, currency) : null;

  const [chosenMonth, setChosenMonth] = useState<{ year: number; month: number } | null>(null);
  const month = chosenMonth?.year === year ? chosenMonth.month : (summary?.defaultMonth ?? null);
  const setMonth = (month: number) => setChosenMonth({ year, month });

  // The list under the chart holds the selected month only; the chart covers the whole year.
  const sections = groupScheduleEventsByMonth(
    yearEvents.filter((event) => monthOf(event) === month),
  );

  return {
    firstYear,
    lastYear,
    year,
    setYear,
    types,
    summary,
    month,
    setMonth,
    sections,
  };
}
