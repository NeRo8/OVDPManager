import {
  type Currency,
  type PositionPayment,
  type ScheduleEvent,
  sumTotals,
} from '@/entities/portfolio';
import { MONTHS, round2 } from '@/shared/lib';

/** One year in one currency, as the chart and the totals show it. */
export type YearSummary = {
  currency: Currency;
  /** Per month, January first */
  monthlyCoupons: number[];
  monthlyRedemptions: number[];
  monthlyPurchases: number[];
  couponTotal: number;
  redemptionTotal: number;
  /** Coupons plus redemptions */
  totalPayments: number;
  /** Payments already received */
  received: number;
  /** Paid for the year's purchases */
  invested: number;
  purchaseCount: number;
  averageMonthlyPurchase: number;
  /** The month to show before one is picked: the next payment's, else the last purchase's */
  defaultMonth: number | null;
};

const monthOf = (event: ScheduleEvent) => Number(event.date.slice(5, 7)) - 1;

/** Sums up one year's events, in schedule order, in the given currency; other currencies are left out. */
export function yearSummary(yearEvents: ScheduleEvent[], currency: Currency): YearSummary {
  const inCurrency = yearEvents.filter((event) => event.currency === currency);
  const payments = inCurrency.filter(
    (event): event is PositionPayment => event.type !== 'purchase',
  );
  const coupons = payments.filter((payment) => payment.type === 'coupon');
  const redemptions = payments.filter((payment) => payment.type === 'redemption');
  const purchases = inCurrency.filter((event) => event.type === 'purchase');
  const monthly = (events: ScheduleEvent[]) =>
    MONTHS.map((_, month) => sumTotals(events.filter((event) => monthOf(event) === month)));

  const couponTotal = sumTotals(coupons);
  const redemptionTotal = sumTotals(redemptions);
  const invested = sumTotals(purchases);
  const upcoming = payments.find((payment) => !payment.isPaid) ?? payments[0];
  const lastPurchase = purchases.at(-1);
  return {
    currency,
    monthlyCoupons: monthly(coupons),
    monthlyRedemptions: monthly(redemptions),
    monthlyPurchases: monthly(purchases),
    couponTotal,
    redemptionTotal,
    totalPayments: round2(couponTotal + redemptionTotal),
    received: sumTotals(payments.filter((payment) => payment.isPaid)),
    invested,
    purchaseCount: purchases.length,
    averageMonthlyPurchase: round2(invested / MONTHS.length),
    defaultMonth: upcoming ? monthOf(upcoming) : lastPurchase ? monthOf(lastPurchase) : null,
  };
}
