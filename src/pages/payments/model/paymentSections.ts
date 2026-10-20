import type { ScheduleEvent } from '@/entities/portfolio';
import { MONTHS, formatTotals } from '@/shared/lib';

export type PaymentSection = {
  key: string;
  title: string;
  /** Income of the month: payments only, purchases are money paid out. Empty without payments. */
  total: string;
  data: ScheduleEvent[];
};

/** Groups date-sorted events into one section per calendar month. */
export function groupPaymentsByMonth(events: ScheduleEvent[]): PaymentSection[] {
  const grouped = new Map<string, ScheduleEvent[]>();
  for (const event of events) {
    const month = event.date.slice(0, 7);
    const monthEvents = grouped.get(month);
    if (monthEvents) monthEvents.push(event);
    else grouped.set(month, [event]);
  }
  return [...grouped].map(([key, data]) => ({
    key,
    title: `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`,
    total: formatTotals(
      data
        .filter((event) => event.type !== 'purchase')
        .map((payment) => ({ currency: payment.currency, value: payment.total })),
    ),
    data,
  }));
}
