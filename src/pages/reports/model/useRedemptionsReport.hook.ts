import { useWallet } from '@/entities/portfolio';
import {
  countRedemptionsReportFilters,
  effectiveScope,
  reportScopeOptions,
  useRedemptionsReportFilters,
} from '@/features/report-filters';

/** The saved filters of the redemptions report, fitted to the active plan's wallet. */
export function useRedemptionsReport() {
  const wallet = useWallet();
  const options = reportScopeOptions(wallet);
  const filters = effectiveScope(useRedemptionsReportFilters(), options);

  return { wallet, filters, options, activeFilterCount: countRedemptionsReportFilters(filters) };
}
