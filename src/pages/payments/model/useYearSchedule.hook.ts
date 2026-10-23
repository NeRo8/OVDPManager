import { useState } from 'react';

import {
  CURRENCIES,
  type Currency,
  type PositionPayment,
  type PurchaseEvent,
  type ScheduleEvent,
  sumTotals,
} from '@/entities/portfolio';
import { filterSchedule } from '@/features/payment-filters';
import { MONTHS, round2 } from '@/shared/lib';
import { groupScheduleEventsByMonth } from './scheduleSections';
import type { FilteredWallet } from './useFilteredWallet.hook';

const yearOf = (event: ScheduleEvent) => Number(event.date.slice(0, 4));
const monthOf = (event: ScheduleEvent) => Number(event.date.slice(5, 7)) - 1;

/** One year of the filtered wallet: totals, the monthly chart and the list of events. */
export function useYearSchedule({ wallet, filters }: FilteredWallet) {
  const currentYear = Number(wallet.today.slice(0, 4));
  const { events } = filterSchedule(wallet, filters, 'years');
  const years = events.map(yearOf);
  const firstYear = years.length ? Math.min(...years) : currentYear;
  const lastYear = years.length ? Math.max(...years) : currentYear;

  const [chosenYear, setChosenYear] = useState<number | null>(null);
  const [chosenCurrency, setChosenCurrency] = useState<Currency | null>(null);
  const [chosenMonth, setChosenMonth] = useState<{ year: number; month: number } | null>(null);

  const year = chosenYear ?? Math.min(Math.max(currentYear, firstYear), lastYear);
  const yearEvents = events.filter((event) => yearOf(event) === year);
  const yearPayments = yearEvents.filter(
    (event): event is PositionPayment => event.type !== 'purchase',
  );
  const currencies = [...new Set(yearEvents.map((event) => event.currency))]
    .filter((currency): currency is Currency => currency !== null)
    .sort((a, b) => CURRENCIES.indexOf(a) - CURRENCIES.indexOf(b));
  // The chart has one money scale, so a year in several currencies shows one at a time.
  const currency =
    chosenCurrency && currencies.includes(chosenCurrency) ? chosenCurrency : currencies[0];

  const coupons = yearPayments.filter(
    (payment) => payment.type === 'coupon' && payment.currency === currency,
  );
  const redemptions = yearPayments.filter(
    (payment) => payment.type === 'redemption' && payment.currency === currency,
  );
  const yearPurchases = yearEvents.filter(
    (event): event is PurchaseEvent => event.type === 'purchase' && event.currency === currency,
  );
  const inMonth = (month: number) => (event: ScheduleEvent) => monthOf(event) === month;
  const monthlyCoupons = MONTHS.map((_, month) => sumTotals(coupons.filter(inMonth(month))));
  const monthlyRedemptions = MONTHS.map((_, month) =>
    sumTotals(redemptions.filter(inMonth(month))),
  );

  const couponTotal = sumTotals(coupons);
  const redemptionTotal = sumTotals(redemptions);
  const purchasedTotal = sumTotals(yearPurchases);
  const monthlyPurchases = MONTHS.map((_, month) =>
    sumTotals(yearPurchases.filter(inMonth(month))),
  );
  const averageMonthlyPurchase = round2(purchasedTotal / MONTHS.length);
  const yearTotal = round2(couponTotal + redemptionTotal);
  const paidTotal = sumTotals([...coupons, ...redemptions].filter((payment) => payment.isPaid));
  const all = [...coupons, ...redemptions].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = all.find((payment) => !payment.isPaid) ?? all[0];
  const lastPurchase = yearPurchases.at(-1);
  const defaultMonth = upcoming ? monthOf(upcoming) : lastPurchase ? monthOf(lastPurchase) : null;
  const selectedMonth = chosenMonth?.year === year ? chosenMonth.month : defaultMonth;
  // Purchases of an unknown currency are listed under every currency, as they may be in any.
  const sections = groupScheduleEventsByMonth(
    yearEvents.filter((event) => event.currency === currency || event.currency === null),
  );

  return {
    firstYear,
    lastYear,
    year,
    setChosenYear,
    currencies,
    currency,
    setChosenCurrency,
    yearPayments,
    yearPurchases,
    purchasedTotal,
    averageMonthlyPurchase,
    monthlyPurchases,
    monthlyCoupons,
    monthlyRedemptions,
    couponTotal,
    redemptionTotal,
    yearTotal,
    paidTotal,
    selectedMonth,
    setChosenMonth,
    sections,
  };
}
