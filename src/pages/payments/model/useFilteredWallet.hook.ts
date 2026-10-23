import { useWallet } from '@/entities/portfolio';
import {
  countActiveFilters,
  effectiveFilters,
  usePaymentFilters,
} from '@/features/payment-filters';

/** The wallet with the saved payment filters, cleaned of bonds the wallet no longer has. */
export function useFilteredWallet() {
  const wallet = useWallet();
  const savedFilters = usePaymentFilters();

  const isins = wallet.positions
    .filter(({ bond }) => bond)
    .map(({ position }) => position.isin)
    .sort();
  const filters = effectiveFilters(savedFilters, isins);

  return { wallet, filters, isins, activeFilterCount: countActiveFilters(filters) };
}

export type FilteredWallet = ReturnType<typeof useFilteredWallet>;
