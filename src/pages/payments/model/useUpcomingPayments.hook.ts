import { useMemo } from 'react';

import { useHoldings, useBonds, portfolioPayments, CURRENCIES } from '@/entities/portfolio';
import {
  countActiveFilters,
  effectiveFilters,
  filterPayments,
  usePaymentFilters,
} from '@/features/payment-filters';
import { todayISO } from '@/shared/lib';
import { groupPaymentsByMonth } from './paymentSections';

export function useUpcomingPayments() {
  const holdings = useHoldings();
  const { bonds, byIsin, isFetching, error, refresh } = useBonds();
  const savedFilters = usePaymentFilters();
  const today = todayISO();

  const allUpcoming = useMemo(
    () => portfolioPayments(holdings, byIsin, today).filter((payment) => !payment.isPaid),
    [holdings, byIsin, today],
  );
  // Filters offer only what is still ahead: bonds and currencies with payments to come.
  const filterOptions = {
    isins: [...new Set(allUpcoming.map((payment) => payment.isin))].sort(),
    currencies: CURRENCIES.filter((currency) =>
      allUpcoming.some((payment) => payment.currency === currency),
    ),
  };
  const filters = effectiveFilters(savedFilters, filterOptions);
  const upcoming = filterPayments(allUpcoming, filters, today);
  const sections = groupPaymentsByMonth(upcoming);

  return {
    holdingsCount: holdings.length,
    bonds,
    byIsin,
    isFetching,
    error,
    refresh,
    allCount: allUpcoming.length,
    upcoming,
    sections,
    filters,
    filterOptions,
    activeFilterCount: countActiveFilters(filters),
  };
}
