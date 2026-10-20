import { useMemo, useState } from 'react';

import { usePlan, FORECAST_CURRENCY, buildForecast, forecastYear } from '@/features/forecast';
import { useHoldings, useBonds, portfolioPayments } from '@/entities/portfolio';
import { useUsdRate } from '@/shared/api';
import { round2 } from '@/shared/lib/number';
import { MONTHS, toISODate } from '@/shared/lib';

const total = (values: number[]) => round2(values.reduce((sum, value) => sum + value, 0));

export function useForecastResults() {
  const holdings = useHoldings();
  const { bonds, byIsin } = useBonds();
  const plan = usePlan();
  const nbuRate = useUsdRate();
  const today = toISODate(new Date());
  const currentYear = Number(today.slice(0, 4));
  const usdRate = plan.usdRate ?? nbuRate?.rate ?? null;

  const walletPayments = useMemo(
    () => portfolioPayments(holdings, byIsin, today),
    [holdings, byIsin, today],
  );
  const forecast = useMemo(
    () => buildForecast(walletPayments, plan, usdRate, today),
    [walletPayments, plan, usdRate, today],
  );
  const hasForeignBonds = walletPayments.some((payment) => payment.currency !== FORECAST_CURRENCY);
  const lastYear = Math.max(currentYear, Number(forecast.payments.at(-1)?.date.slice(0, 4) ?? 0));

  const [chosenYear, setChosenYear] = useState<number | null>(null);
  const [chosenMonth, setChosenMonth] = useState<{ year: number; month: number } | null>(null);

  const year = Math.min(Math.max(chosenYear ?? currentYear, currentYear), lastYear);
  const summary = useMemo(() => forecastYear(forecast, year), [forecast, year]);
  const walletTotal = total(summary.walletIncome);
  const planTotal = total(summary.planIncome);
  const yearTotal = round2(walletTotal + planTotal);
  const monthTotal = (month: number) => summary.walletIncome[month] + summary.planIncome[month];

  const firstMonth = year === currentYear ? Number(today.slice(5, 7)) - 1 : 0;
  const withIncome = MONTHS.map((_, month) => month).filter((month) => monthTotal(month) > 0);
  const defaultMonth =
    withIncome.find((month) => month >= firstMonth) ?? withIncome[0] ?? firstMonth;
  const selectedMonth = chosenMonth?.year === year ? chosenMonth.month : defaultMonth;
  const topUpMonths = summary.purchases.filter((purchase) => purchase.contribution > 0).length;

  return {
    holdings,
    bonds,
    currentYear,
    lastYear,
    year,
    setChosenYear,
    summary,
    hasForeignBonds,
    walletTotal,
    planTotal,
    yearTotal,
    monthTotal,
    selectedMonth,
    setChosenMonth,
    topUpMonths,
  };
}
