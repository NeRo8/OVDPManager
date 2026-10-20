import { useMemo, useState } from 'react';

import {
  useHoldings,
  useBonds,
  type ScheduleEvent,
  portfolioPayments,
  purchaseEvents,
  sumTotals,
} from '@/entities/portfolio';
import { MONTHS, todayISO, round2 } from '@/shared/lib';
import { groupPaymentsByMonth } from './paymentSections';

const CURRENCY_ORDER = ['UAH', 'USD', 'EUR'];

const yearOf = (event: ScheduleEvent) => Number(event.date.slice(0, 4));
const monthOf = (event: ScheduleEvent) => Number(event.date.slice(5, 7)) - 1;

/** By date; on the same day a payment goes first, as it belongs to the previous owner. */
function byDate(a: ScheduleEvent, b: ScheduleEvent) {
  return (
    a.date.localeCompare(b.date) || Number(a.type === 'purchase') - Number(b.type === 'purchase')
  );
}

export function usePaymentSchedule() {
  const holdings = useHoldings();
  const { bonds, byIsin } = useBonds();
  const today = todayISO();
  const currentYear = Number(today.slice(0, 4));
  const payments = useMemo(
    () => portfolioPayments(holdings, byIsin, today),
    [holdings, byIsin, today],
  );
  const purchases = useMemo(() => purchaseEvents(holdings, byIsin), [holdings, byIsin]);
  const years = [...payments, ...purchases].map(yearOf);
  const firstYear = years.length ? Math.min(...years) : currentYear;
  const lastYear = years.length ? Math.max(...years) : currentYear;

  const [chosenYear, setChosenYear] = useState<number | null>(null);
  const [chosenCurrency, setChosenCurrency] = useState<string | null>(null);
  const [chosenMonth, setChosenMonth] = useState<{ year: number; month: number } | null>(null);

  const year = chosenYear ?? Math.min(Math.max(currentYear, firstYear), lastYear);
  const yearPayments = payments.filter((payment) => yearOf(payment) === year);
  const yearEvents = [...yearPayments, ...purchases.filter((p) => yearOf(p) === year)];
  const currencies = [...new Set(yearEvents.map((event) => event.currency))].sort(
    (a, b) => CURRENCY_ORDER.indexOf(a) - CURRENCY_ORDER.indexOf(b),
  );
  const currency =
    chosenCurrency && currencies.includes(chosenCurrency) ? chosenCurrency : currencies[0];

  const coupons = yearPayments.filter(
    (payment) => payment.type === 'coupon' && payment.currency === currency,
  );
  const redemptions = yearPayments.filter(
    (payment) => payment.type === 'redemption' && payment.currency === currency,
  );
  const yearPurchases = purchases.filter(
    (purchase) => yearOf(purchase) === year && purchase.currency === currency,
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
  const sections = groupPaymentsByMonth(
    [...coupons, ...redemptions, ...yearPurchases].sort(byDate),
  );

  return {
    holdings,
    bonds,
    payments,
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
