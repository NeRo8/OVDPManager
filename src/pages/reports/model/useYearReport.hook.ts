import { useWallet } from '@/entities/portfolio';
import {
  countYearReportFilters,
  effectiveScope,
  reportScopeOptions,
  reportYear,
  reportYears,
  useYearReportFilters,
} from '@/features/report-filters';

/** The saved year and filters of the year report, fitted to the active plan's wallet. */
export function useYearReport() {
  const wallet = useWallet();
  const options = reportScopeOptions(wallet);
  const filters = effectiveScope(useYearReportFilters(), options);
  const years = reportYears(wallet);

  return {
    wallet,
    filters,
    options,
    years,
    year: reportYear(filters, years),
    activeFilterCount: countYearReportFilters(filters, years),
  };
}
