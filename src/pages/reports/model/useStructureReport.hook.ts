import { useWallet } from '@/entities/portfolio';
import {
  countStructureReportFilters,
  effectiveScope,
  reportScopeOptions,
  useStructureReportFilters,
} from '@/features/report-filters';

/** The saved filters of the portfolio structure report, fitted to the active plan's wallet. */
export function useStructureReport() {
  const wallet = useWallet();
  const options = reportScopeOptions(wallet);
  const filters = effectiveScope(useStructureReportFilters(), options);

  return { wallet, filters, options, activeFilterCount: countStructureReportFilters(filters) };
}
