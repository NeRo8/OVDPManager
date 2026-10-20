import { useMemo, useState } from 'react';

import {
  useHoldings,
  useBonds,
  type PositionPayment,
  portfolioPayments,
  sumTotals,
} from '@/entities/portfolio';
import { MONTHS, todayISO, round2 } from '@/shared/lib';
import { groupPaymentsByMonth } from './paymentSections';

const CURRENCY_ORDER = ['UAH', 'USD', 'EUR'];

export function usePaymentSchedule() {
  const holdings = useHoldings();
  const { bonds, byIsin } = useBonds();
  const today = todayISO();
  const currentYear = Number(today.slice(0, 4));
  const payments = useMemo(
    () => portfolioPayments(holdings, byIsin, today),
    [holdings, byIsin, today],
  );
  const firstYear = payments.length ? Number(payments[0].date.slice(0, 4)) : currentYear;
  const lastYear = payments.length ? Number(payments.at(-1)!.date.slice(0, 4)) : currentYear;

  const [chosenYear, setChosenYear] = useState<number | null>(null);
  const [chosenCurrency, setChosenCurrency] = useState<string | null>(null);
  const [chosenMonth, setChosenMonth] = useState<{ year: number; month: number } | null>(null);

  const year = chosenYear ?? Math.min(Math.max(currentYear, firstYear), lastYear);
  const yearPayments = payments.filter((payment) => payment.date.startsWith(`${year}-`));
  const currencies = [...new Set(yearPayments.map((payment) => payment.currency))].sort(
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
  const inMonth = (month: number) => (payment: PositionPayment) =>
    Number(payment.date.slice(5, 7)) - 1 === month;
  const monthlyCoupons = MONTHS.map((_, month) => sumTotals(coupons.filter(inMonth(month))));
  const monthlyRedemptions = MONTHS.map((_, month) =>
    sumTotals(redemptions.filter(inMonth(month))),
  );

  const couponTotal = sumTotals(coupons);
  const redemptionTotal = sumTotals(redemptions);
  const yearTotal = round2(couponTotal + redemptionTotal);
  const paidTotal = sumTotals([...coupons, ...redemptions].filter((payment) => payment.isPaid));
  const all = [...coupons, ...redemptions].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = all.find((payment) => !payment.isPaid) ?? all[0];
  const defaultMonth = upcoming ? Number(upcoming.date.slice(5, 7)) - 1 : null;
  const selectedMonth = chosenMonth?.year === year ? chosenMonth.month : defaultMonth;
  const sections = groupPaymentsByMonth(
    yearPayments.filter((payment) => payment.currency === currency),
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
