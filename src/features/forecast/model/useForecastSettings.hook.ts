import { updatePlan, usePlan } from './forecastPlan.store';
import { useUsdRate } from '@/shared/api';
import { toISODate } from '@/shared/lib';

export const MAX_PLAN_YEARS = 10;

export function useForecastSettings() {
  const plan = usePlan();
  const nbuRate = useUsdRate();
  const currentYear = Number(toISODate(new Date()).slice(0, 4));
  const planEndYear = Math.max(plan.contributeUntilYear, plan.reinvestUntilYear);

  return {
    plan,
    nbuRate,
    currentYear,
    planEndYear,
    setMonthlyUsd: (value: number | null) => updatePlan({ monthlyUsd: value ?? 0 }),
    setUsdRate: (value: number | null) => updatePlan({ usdRate: value || null }),
    setContributeUntilYear: (value: number) => updatePlan({ contributeUntilYear: value }),
    setReinvestUntilYear: (value: number) => updatePlan({ reinvestUntilYear: value }),
    setReinvestNominal: (value: boolean) => updatePlan({ reinvestNominal: value }),
    setYieldRate: (value: number | null) => updatePlan({ yieldRate: value ?? 0 }),
    setTermMonths: (termMonths: typeof plan.termMonths) => updatePlan({ termMonths }),
  };
}
