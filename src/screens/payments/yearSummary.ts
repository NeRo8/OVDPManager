import {
  type Currency,
  type OperationEvent,
  type PositionPayment,
  type ScheduleEvent,
  receivedAmount,
  sumTotals,
} from '@/lib/portfolio/portfolio';
import { MONTHS } from '@/utils/format';
import { round2 } from '@/utils/number';

/** One year in one currency, as the chart and the totals show it. */
export type YearSummary = {
  currency: Currency;
  /** Per month, January first */
  monthlyCoupons: number[];
  monthlyRedemptions: number[];
  monthlySales: number[];
  saleTotal: number;
  /** Purchases made, and the planned ones (not yet confirmed) apart */
  monthlyPurchases: number[];
  monthlyPlannedPurchases: number[];
  couponTotal: number;
  redemptionTotal: number;
  /** Coupons plus redemptions */
  totalPayments: number;
  /** Payments already received */
  received: number;
  /** Paid for the year's operations, planned ones included */
  invested: number;
  /** The part of `invested` that is planned operations */
  planned: number;
  purchaseCount: number;
  averageMonthlyPurchase: number;
  /** The month of the next event, or the last event when all are past. */
  defaultMonth: number | null;
};

const monthOf = (event: ScheduleEvent) => Number(event.date.slice(5, 7)) - 1;

/** Sums up one year's events, in schedule order, in the given currency; other currencies are left out. */
export function yearSummary(
  yearEvents: ScheduleEvent[],
  currency: Currency,
  today: string,
): YearSummary {
  const inCurrency = yearEvents.filter((event) => event.currency === currency);
  const payments = inCurrency.filter(
    (event): event is PositionPayment => event.type === 'coupon' || event.type === 'redemption',
  );
  const sales = inCurrency.filter((event): event is OperationEvent => event.type === 'sale');
  const saleTotal = sumTotals(sales);
  const coupons = payments.filter((payment) => payment.type === 'coupon');
  const redemptions = payments.filter((payment) => payment.type === 'redemption');
  const operations = inCurrency.filter(
    (event): event is OperationEvent => event.type === 'purchase',
  );
  const plannedPurchases = operations.filter((event) => event.planned);
  const monthly = (events: ScheduleEvent[]) =>
    MONTHS.map((_, month) => sumTotals(events.filter((event) => monthOf(event) === month)));

  const couponTotal = sumTotals(coupons);
  const redemptionTotal = sumTotals(redemptions);
  const invested = sumTotals(operations);
  const nextEvent = inCurrency.find((event) => event.date >= today) ?? inCurrency.at(-1);
  return {
    currency,
    monthlySales: monthly(sales),
    saleTotal,
    monthlyCoupons: monthly(coupons),
    monthlyRedemptions: monthly(redemptions),
    monthlyPurchases: monthly(operations.filter((event) => !event.planned)),
    monthlyPlannedPurchases: monthly(plannedPurchases),
    couponTotal,
    redemptionTotal,
    totalPayments: round2(couponTotal + redemptionTotal + saleTotal),
    received: round2(
      payments.reduce((sum, payment) => sum + receivedAmount(payment), 0) +
        sumTotals(sales.filter((sale) => !sale.planned)),
    ),
    invested,
    planned: sumTotals(plannedPurchases),
    purchaseCount: operations.length,
    averageMonthlyPurchase: round2(invested / MONTHS.length),
    defaultMonth: nextEvent ? monthOf(nextEvent) : null,
  };
}
