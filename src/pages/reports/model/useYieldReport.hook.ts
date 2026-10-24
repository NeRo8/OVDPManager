import { useKeyRates, useWallet } from '@/entities/portfolio';
import {
  countYieldReportFilters,
  effectiveScope,
  reportScopeOptions,
  useYieldReportFilters,
} from '@/features/report-filters';
import { purchaseDates } from './yieldReport';

/**
 * The saved filters of the yield report, fitted to the active plan's wallet, and the NBU key rate
 * today and on every purchase date.
 */
export function useYieldReport() {
  const wallet = useWallet();
  const options = reportScopeOptions(wallet);
  const filters = effectiveScope(useYieldReportFilters(), options);
  const keyRateOn = useKeyRates([...purchaseDates(wallet), wallet.today]);

  return {
    wallet,
    filters,
    options,
    keyRateOn,
    activeFilterCount: countYieldReportFilters(filters),
  };
}
