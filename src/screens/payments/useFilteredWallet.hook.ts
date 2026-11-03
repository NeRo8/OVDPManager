import { useWallet } from '@/hooks/useWallet.hook';
import { countActiveFilters, effectiveFilters } from '@/lib/payment-filters/filterSchedule';
import type { Currency } from '@/lib/portfolio/portfolio';
import { walletScopeOptions } from '@/lib/portfolio/wallet';
import { usePaymentFilters } from '@/stores/paymentFilters';

/** The wallet with the saved payment filters, fitted to the bonds and currencies it has. */
export function useFilteredWallet() {
  const wallet = useWallet();
  const options = walletScopeOptions(wallet);
  const saved = usePaymentFilters();
  const filters = effectiveFilters(saved, options);

  return {
    wallet,
    filters,
    options,
    activeFilterCount: countActiveFilters(filters, options),
    /** The filters as they would read with another currency: its own bonds ticked, if any */
    withCurrency: (currency: Currency) => effectiveFilters({ ...saved, currency }, options),
  };
}

export type FilteredWallet = ReturnType<typeof useFilteredWallet>;
