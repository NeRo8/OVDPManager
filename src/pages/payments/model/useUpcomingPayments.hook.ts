import { useMemo } from 'react';

import { useHoldings, useBonds, portfolioPayments } from '@/entities/portfolio';
import type { PositionPayment } from '@/entities/portfolio';
import { MONTHS, formatTotals, toISODate } from '@/shared/lib';

export type PaymentSection = {
  key: string;
  title: string;
  total: string;
  data: PositionPayment[];
};

export function useUpcomingPayments() {
  const holdings = useHoldings();
  const { bonds, byIsin, isFetching, error, refresh } = useBonds();
  const today = toISODate(new Date());

  const upcoming = useMemo(
    () => portfolioPayments(holdings, byIsin, today).filter((payment) => !payment.isPaid),
    [holdings, byIsin, today],
  );
  const sections = useMemo(() => {
    const grouped = new Map<string, PositionPayment[]>();
    for (const payment of upcoming) {
      const month = payment.date.slice(0, 7);
      const monthPayments = grouped.get(month);
      if (monthPayments) monthPayments.push(payment);
      else grouped.set(month, [payment]);
    }
    return [...grouped].map(([key, data]): PaymentSection => ({
      key,
      title: `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`,
      total: formatTotals(
        data.map((payment) => ({ currency: payment.currency, value: payment.total })),
      ),
      data,
    }));
  }, [upcoming]);

  return { holdingsCount: holdings.length, bonds, isFetching, error, refresh, upcoming, sections };
}
