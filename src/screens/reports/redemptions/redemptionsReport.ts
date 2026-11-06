import {
  CURRENCIES,
  type Currency,
  type PositionPayment,
  receivedAmount,
} from '@/lib/portfolio/portfolio';
import type { Wallet } from '@/lib/portfolio/wallet';
import { round2 } from '@/utils/number';

export type RedemptionTime = 'upcoming' | 'past' | 'all';
export type RedemptionEntry = {
  payment: PositionPayment;
  received: number;
  expected: number;
  planned: number;
  total: number;
};
export type RedemptionYear = {
  year: number;
  total: number;
  quarters: { quarter: number; total: number }[];
};
export type CurrencyRedemptions = {
  currency: Currency;
  total: number;
  received: number;
  expected: number;
  planned: number;
  entries: RedemptionEntry[];
  years: RedemptionYear[];
};

/** A past-dated unconfirmed purchase remains expected, even after the redemption date. */
export function redemptionsReport(wallet: Wallet, time: RedemptionTime): CurrencyRedemptions[] {
  const entries = wallet.payments.flatMap((payment): RedemptionEntry[] => {
    if (payment.type !== 'redemption') return [];
    const received = round2(receivedAmount(payment));
    const expected = round2(payment.total - received);
    const selectedReceived = time === 'upcoming' ? 0 : received;
    const selectedExpected = time === 'past' ? 0 : expected;
    const total = round2(selectedReceived + selectedExpected);
    if (total === 0) return [];
    return [
      {
        payment,
        received: selectedReceived,
        expected: selectedExpected,
        planned: time === 'past' ? 0 : round2(payment.amount * payment.plannedQuantity),
        total,
      },
    ];
  });

  return CURRENCIES.flatMap((currency): CurrencyRedemptions[] => {
    const selected = entries.filter(({ payment }) => payment.currency === currency);
    if (!selected.length) return [];
    const sum = (items: RedemptionEntry[], field: 'total' | 'received' | 'expected' | 'planned') =>
      round2(items.reduce((result, item) => result + item[field], 0));
    const first = Number(selected[0].payment.date.slice(0, 4));
    const last = Number(selected[selected.length - 1].payment.date.slice(0, 4));
    const years = Array.from({ length: last - first + 1 }, (_, index): RedemptionYear => {
      const year = first + index;
      const inYear = selected.filter(({ payment }) => Number(payment.date.slice(0, 4)) === year);
      const quarters = [1, 2, 3, 4].flatMap((quarter) => {
        const inQuarter = inYear.filter(
          ({ payment }) => Math.ceil(Number(payment.date.slice(5, 7)) / 3) === quarter,
        );
        return inQuarter.length ? [{ quarter, total: sum(inQuarter, 'total') }] : [];
      });
      return { year, total: sum(inYear, 'total'), quarters };
    });
    return [
      {
        currency,
        total: sum(selected, 'total'),
        received: sum(selected, 'received'),
        expected: sum(selected, 'expected'),
        planned: sum(selected, 'planned'),
        entries: selected,
        years,
      },
    ];
  });
}
