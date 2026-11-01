import { type CouponGoal, type Wallet } from '@/entities/portfolio';

import { round2 } from '@/shared/lib';

import { goalMonthIndex, goalPurchaseSpan, monthStarts } from './goalSpans';

/** Where a plan stands against its saved goal: the card on the plans tab. */
export type GoalProgress = {
  /** What is left of «Роки купівель» */
  from: string;
  to: string;
  /** «Місяців з ціллю»: months of «Роки купонів» whose coupons reach the goal */
  monthsOnGoal: number;
  /** All the months of «Роки купонів» */
  goalMonths: number;
  /** Planned purchases still ahead in «Роки купівель» */
  plannedCount: number;
  plannedAmount: number;
  /** «Власні кошти на місяць»: those purchases less the plan's money, over the months left */
  monthlyTopUp: number;
  topUpMonths: number;
};

/**
 * The plan as it stands against its goal. The own money follows the purchases as they are
 * confirmed: what the planned purchases of «Роки купівель» cost beyond the plan's coupons and
 * redemptions in what is left of them (none when the goal takes them out), spread over its months.
 */
export function goalProgress(wallet: Wallet, goal: CouponGoal): GoalProgress {
  const span = goalPurchaseSpan(goal, wallet.today);
  const inCurrency = <T extends { currency: string }>(items: T[]) =>
    items.filter((item) => item.currency === goal.currency);
  const goalMonths = goal.incomeYears * 12;
  const coupons = Array.from({ length: goalMonths }, () => 0);
  for (const payment of inCurrency(wallet.payments)) {
    const index = goalMonthIndex(goal, payment.date);
    if (payment.type === 'coupon' && index >= 0) coupons[index] += payment.total;
  }
  const inSpan = (date: string) => date >= span.from && date <= span.to;
  const planned = inCurrency(wallet.purchaseEvents).filter((event) => inSpan(event.date));
  const plannedAmount = round2(planned.reduce((sum, event) => sum + event.total, 0));
  const planMoney = goal.reinvest
    ? inCurrency(wallet.payments).filter((payment) => inSpan(payment.date))
    : [];
  const starts = span.from <= span.to ? monthStarts(span) : [];
  const topUpMonths = starts.length;
  let spent = 0;
  let monthlyTopUp = 0;
  for (const purchase of [...planned].sort((a, b) => a.date.localeCompare(b.date))) {
    spent = round2(spent + purchase.total);
    const received = planMoney
      .filter((payment) => payment.date <= purchase.date)
      .reduce((sum, payment) => sum + payment.total, 0);
    const months = starts.filter((date) => date <= purchase.date).length;
    if (months > 0)
      monthlyTopUp = Math.max(monthlyTopUp, Math.ceil(round2(spent - received) / months));
  }
  return {
    ...span,
    monthsOnGoal: coupons.filter((sum) => round2(sum) >= goal.monthly).length,
    goalMonths,
    plannedCount: planned.length,
    plannedAmount,
    monthlyTopUp,
    topUpMonths,
  };
}
