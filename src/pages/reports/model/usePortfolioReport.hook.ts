import { useWallet } from '@/entities/portfolio';
import {
  countPortfolioReportFilters,
  effectiveScope,
  reportScopeOptions,
  usePortfolioReportFilters,
} from '@/features/report-filters';

/** The saved filters of the portfolio report, fitted to the active plan's wallet. */
export function usePortfolioReport() {
  const wallet = useWallet();
  const options = reportScopeOptions(wallet);
  const filters = effectiveScope(usePortfolioReportFilters(), options);

  return { wallet, filters, options, activeFilterCount: countPortfolioReportFilters(filters) };
}
