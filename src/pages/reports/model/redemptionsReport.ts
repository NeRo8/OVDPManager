import {
  CURRENCIES,
  type Currency,
  type PositionPayment,
  type Wallet,
  sumTotals,
} from '@/entities/portfolio';
import type { RedemptionTime } from '@/features/report-filters';
import { round2 } from '@/shared/lib';

/** The redemptions of one quarter. */
export type RedemptionQuarter = {
  /** 1–4 */
  quarter: number;
  total: number;
  /** Its share of all the redemptions in the currency, % */
  share: number;
};

/** The redemptions of one year; a year without any is there too, so the years run unbroken. */
export type RedemptionYear = {
  year: number;
  total: number;
  /** Its share of all the redemptions in the currency, % */
  share: number;
  /** Only the quarters with a redemption */
  quarters: RedemptionQuarter[];
};

/** The redemptions in one currency. */
export type CurrencyRedemptions = {
  currency: Currency;
  total: number;
  received: number;
  expected: number;
  /** By date */
  payments: PositionPayment[];
  /** From the first redemption's year to the last's */
  years: RedemptionYear[];
  /** The first redemption still ahead */
  next?: PositionPayment;
  /** The last redemption */
  last: PositionPayment;
};

const yearOf = (date: string) => Number(date.slice(0, 4));
const quarterOf = (date: string) => Math.floor((Number(date.slice(5, 7)) - 1) / 3) + 1;

const passesTime = (payment: PositionPayment, time: RedemptionTime) =>
  time === 'all' || payment.isPaid === (time === 'past');

/** The wallet's redemptions in the time picked, per currency, by year and quarter. */
export function redemptionsReport(wallet: Wallet, time: RedemptionTime): CurrencyRedemptions[] {
  const redemptions = wallet.payments.filter(
    (payment) => payment.type === 'redemption' && passesTime(payment, time),
  );

  return CURRENCIES.flatMap((currency): CurrencyRedemptions[] => {
    const payments = redemptions.filter((payment) => payment.currency === currency);
    const last = payments.at(-1);
    if (!last) return [];
    const total = sumTotals(payments);
    const shareOf = (part: number) => (total > 0 ? round2((part / total) * 100) : 0);
    const firstYear = yearOf(payments[0].date);

    const years = Array.from({ length: yearOf(last.date) - firstYear + 1 }, (_, index) => {
      const year = firstYear + index;
      const inYear = payments.filter((payment) => yearOf(payment.date) === year);
      const yearTotal = sumTotals(inYear);
      const quarters = [1, 2, 3, 4].flatMap((quarter): RedemptionQuarter[] => {
        const inQuarter = inYear.filter((payment) => quarterOf(payment.date) === quarter);
        if (!inQuarter.length) return [];
        const quarterTotal = sumTotals(inQuarter);
        return [{ quarter, total: quarterTotal, share: shareOf(quarterTotal) }];
      });
      return { year, total: yearTotal, share: shareOf(yearTotal), quarters };
    });

    return [
      {
        currency,
        total,
        received: sumTotals(payments.filter((payment) => payment.isPaid)),
        expected: sumTotals(payments.filter((payment) => !payment.isPaid)),
        payments,
        years,
        next: payments.find((payment) => !payment.isPaid),
        last,
      },
    ];
  });
}
