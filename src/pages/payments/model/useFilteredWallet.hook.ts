import {
  countActiveFilters,
  effectiveFilters,
  usePaymentFilters,
} from '@/features/payment-filters';

import { useWallet, walletScopeOptions } from '@/entities/portfolio';

/** The wallet with the saved payment filters, fitted to the bonds and currencies it has. */
export function useFilteredWallet() {
  const wallet = useWallet();
  const options = walletScopeOptions(wallet);
  const filters = effectiveFilters(usePaymentFilters(), options);

  return { wallet, filters, options, activeFilterCount: countActiveFilters(filters, options) };
}

export type FilteredWallet = ReturnType<typeof useFilteredWallet>;
