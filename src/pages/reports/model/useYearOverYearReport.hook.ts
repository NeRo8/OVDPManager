import { useWallet } from '@/entities/portfolio';
import {
  countScopeFilters,
  effectiveScope,
  reportScopeOptions,
  useYearOverYearReportFilters,
} from '@/features/report-filters';

/** The saved filters of the year-over-year report, fitted to the active plan's wallet. */
export function useYearOverYearReport() {
  const wallet = useWallet();
  const options = reportScopeOptions(wallet);
  const filters = effectiveScope(useYearOverYearReportFilters(), options);

  return { wallet, filters, options, activeFilterCount: countScopeFilters(filters) };
}
