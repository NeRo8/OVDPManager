import { useMemo } from 'react';

import { useHoldings, useBonds, portfolioPayments } from '@/entities/portfolio';
import { todayISO } from '@/shared/lib';
import { groupPaymentsByMonth } from './paymentSections';

export function useUpcomingPayments() {
  const holdings = useHoldings();
  const { bonds, byIsin, isFetching, error, refresh } = useBonds();
  const today = todayISO();

  const upcoming = useMemo(
    () => portfolioPayments(holdings, byIsin, today).filter((payment) => !payment.isPaid),
    [holdings, byIsin, today],
  );
  const sections = useMemo(() => groupPaymentsByMonth(upcoming), [upcoming]);

  return { holdingsCount: holdings.length, bonds, isFetching, error, refresh, upcoming, sections };
}
