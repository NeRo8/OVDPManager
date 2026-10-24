import { CURRENCIES, useWallet } from '@/entities/portfolio';
import {
  countActiveFilters,
  effectiveFilters,
  usePaymentFilters,
  type PaymentFilterOptions,
} from '@/features/payment-filters';

/** The wallet with the saved payment filters, fitted to the bonds and currencies it has. */
export function useFilteredWallet() {
  const wallet = useWallet();
  const savedFilters = usePaymentFilters();

  const options: PaymentFilterOptions = {
    isins: wallet.positions
      .filter(({ bond }) => bond)
      .map(({ position }) => position.isin)
      .sort(),
    currencies: CURRENCIES.filter((currency) =>
      [...wallet.payments, ...wallet.purchaseEvents].some((event) => event.currency === currency),
    ),
  };
  const filters = effectiveFilters(savedFilters, options);

  return { wallet, filters, options, activeFilterCount: countActiveFilters(filters, options) };
}

export type FilteredWallet = ReturnType<typeof useFilteredWallet>;
