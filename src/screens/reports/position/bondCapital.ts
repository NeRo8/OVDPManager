import { compareOperations, purchaseLots } from '@/lib/portfolio/operations';
import {
  positionPayments,
  receivedAmount,
  type Bond,
  type Operation,
  type PositionPayment,
} from '@/lib/portfolio/portfolio';
import type { WalletPosition } from '@/lib/portfolio/position';
import type { ReportCapitalChart } from '@/screens/reports/shared/reportSection';
import { daysBetween } from '@/utils/date';
import { round2 } from '@/utils/number';

type Snapshot = { invested: number; received: number };

function validConfirmedHistory(operations: Operation[]): boolean {
  let quantity = 0;
  for (const operation of [...operations].sort(compareOperations)) {
    quantity += operation.type === 'purchase' ? operation.quantity : -operation.quantity;
    if (quantity < 0) return false;
  }
  return true;
}

function nominalOn(bond: Bond, date: string, today: string, confirmed: boolean): number {
  return (
    bond.nominal -
    bond.payments
      .filter(
        (payment) =>
          payment.type === 'redemption' &&
          payment.date <= date &&
          (!confirmed || payment.date < today),
      )
      .reduce((sum, payment) => sum + payment.amount, 0)
  );
}

function snapshot(
  operations: Operation[],
  payments: PositionPayment[],
  bond: Bond,
  date: string,
  today: string,
  confirmed: boolean,
): Snapshot {
  const through = confirmed && date > today ? today : date;
  const selected = operations.filter(
    (operation) => operation.date <= through && (!confirmed || !operation.planned),
  );
  const invested = purchaseLots(selected).reduce((sum, { purchase, remaining }) => {
    const original = nominalOn(bond, purchase.date, today, confirmed);
    const current = nominalOn(bond, through, today, confirmed);
    if (original <= 0) return sum;
    return (
      sum +
      ((purchase.amount / purchase.quantity) *
        remaining *
        Math.max(0, Math.min(original, current))) /
        original
    );
  }, 0);
  const proceeds = payments
    .filter((payment) => payment.date <= through)
    .reduce((sum, payment) => sum + (confirmed ? receivedAmount(payment) : payment.total), 0);
  const sales = selected
    .filter((operation) => operation.type === 'sale')
    .reduce((sum, operation) => sum + operation.amount, 0);
  return { invested: round2(invested), received: round2(proceeds + sales) };
}

/** End-of-day cost basis and cumulative proceeds for the confirmed history and the full plan. */
export function bondCapitalChart(item: WalletPosition, today: string): ReportCapitalChart | null {
  const { bond, position, currency } = item;
  if (!bond) return null;
  const confirmed = position.operations.filter(
    (operation) => !operation.planned && operation.date <= today,
  );
  const confirmedPayments = positionPayments(confirmed, bond, today);
  const events = [
    ...position.operations.map((operation) => operation.date),
    ...item.payments.map((payment) => payment.date),
    ...confirmedPayments.filter((payment) => payment.isPaid).map((payment) => payment.date),
  ].sort();
  if (!events.length) return null;
  const dates = [
    ...new Set([
      ...events,
      ...(today > events[0] && today < events[events.length - 1] ? [today] : []),
    ]),
  ].sort();
  const actualAvailable = validConfirmedHistory(confirmed);
  const actual = actualAvailable
    ? dates.map((date) => snapshot(confirmed, confirmedPayments, bond, date, today, true))
    : [];
  const plan = dates.map((date) =>
    snapshot(position.operations, item.payments, bond, date, today, false),
  );
  const differs =
    !actualAvailable ||
    plan.some(
      (point, index) =>
        point.invested !== actual[index].invested || point.received !== actual[index].received,
    );
  const span = daysBetween(dates[0], dates[dates.length - 1]);
  return {
    currency,
    dates,
    positions: dates.map((date) => (span ? daysBetween(dates[0], date) / span : 0.5)),
    actualAvailable,
    series: [
      ...(actualAvailable
        ? [
            {
              label: 'Залишок вкладень · факт',
              color: 'purchase' as const,
              values: actual.map((point) => point.invested),
            },
            {
              label: 'Надходження · факт',
              color: 'coupon' as const,
              values: actual.map((point) => point.received),
            },
          ]
        : []),
      ...(differs
        ? [
            {
              label: 'Залишок вкладень · план',
              color: 'plannedPurchase' as const,
              values: plan.map((point) => point.invested),
            },
            {
              label: 'Надходження · план',
              color: 'redemption' as const,
              values: plan.map((point) => point.received),
            },
          ]
        : []),
    ],
  };
}
