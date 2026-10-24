import { useWallet } from '@/entities/portfolio';
import {
  countPeriodReportFilters,
  effectiveScope,
  periodDates,
  reportScopeOptions,
  usePeriodReportFilters,
} from '@/features/report-filters';

/** The saved period and filters of the period report, fitted to the active plan's wallet. */
export function useReportPeriod() {
  const wallet = useWallet();
  const options = reportScopeOptions(wallet);
  const filters = effectiveScope(usePeriodReportFilters(), options);

  return {
    wallet,
    filters,
    options,
    period: periodDates(filters.period, wallet, filters.custom),
    activeFilterCount: countPeriodReportFilters(filters),
  };
}
