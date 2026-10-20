import type { PositionPayment } from '@/entities/portfolio';
import { MONTHS, formatTotals } from '@/shared/lib';

export type PaymentSection = {
  key: string;
  title: string;
  total: string;
  data: PositionPayment[];
};

/** Groups date-sorted payments into one section per calendar month. */
export function groupPaymentsByMonth(payments: PositionPayment[]): PaymentSection[] {
  const grouped = new Map<string, PositionPayment[]>();
  for (const payment of payments) {
    const month = payment.date.slice(0, 7);
    const monthPayments = grouped.get(month);
    if (monthPayments) monthPayments.push(payment);
    else grouped.set(month, [payment]);
  }
  return [...grouped].map(([key, data]) => ({
    key,
    title: `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`,
    total: formatTotals(
      data.map((payment) => ({ currency: payment.currency, value: payment.total })),
    ),
    data,
  }));
}
