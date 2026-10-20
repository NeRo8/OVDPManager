import { useMemo } from 'react';

import {
  useHoldings,
  useBonds,
  groupPositions,
  nextPayment,
  positionPayments,
} from '@/entities/portfolio';
import { todayISO } from '@/shared/lib';

export function usePortfolio() {
  const holdings = useHoldings();
  const { bonds, byIsin, isFetching, error, refresh } = useBonds();
  const today = todayISO();

  const rows = useMemo(
    () =>
      groupPositions(holdings).map((position) => {
        const bond = byIsin.get(position.isin);
        const payments = bond ? positionPayments(position.lots, bond, today) : [];
        return { position, bond, payments, next: nextPayment(payments) };
      }),
    [holdings, byIsin, today],
  );

  const upcoming = useMemo(
    () =>
      rows
        .flatMap((r) => r.payments.filter((p) => !p.isPaid))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [rows],
  );
  const nextDate = upcoming[0]?.date;
  const nextGroup = nextDate ? upcoming.filter((p) => p.date === nextDate) : [];

  return {
    holdingsCount: holdings.length,
    bonds,
    isFetching,
    error,
    refresh,
    today,
    rows,
    nextDate,
    nextGroup,
  };
}
