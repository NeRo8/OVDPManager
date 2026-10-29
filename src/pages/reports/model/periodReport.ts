import {
  CURRENCIES,
  type Currency,
  type PositionPayment,
  type ScheduleEvent,
  type Wallet,
  positionIncome,
  sumTotals,
} from '@/entities/portfolio';

import { monthsBetween, round2 } from '@/shared/lib';

/** Money that went out and came in. */
export type Flows = {
  /** Paid for purchases, planned ones included */
  invested: number;
  coupons: number;
  redemptions: number;
};

/** One month of the period; the first and the last count only their days inside it. */
export type MonthFlows = Flows & {
  /** YYYY-MM */
  month: string;
};

/** One bond's purchases and payments in the period. */
export type BondReport = Flows & {
  isin: string;
  /** Coupons plus what the redemptions brought over the cost of the bonds repaid */
  income: number;
  /** «Річна дохідність» of the bond held to maturity; null until NBU publishes its redemption */
  annualYield: number | null;
  /** Its income as % of the period's income in the currency; null unless both are above zero */
  incomeShare: number | null;
};

/**
 * The bonds that stand out in the period; each is left out when there are not two to compare, and
 * the largest income when none is above zero.
 */
export type BondHighlights = {
  highestYield?: BondReport;
  lowestYield?: BondReport;
  highestIncome?: BondReport;
};

/** The period of the wallet in one currency. */
export type CurrencyReport = Flows & {
  currency: Currency;
  /** Coupons plus redemptions */
  totalPayments: number;
  /** Payments already received */
  received: number;
  /** Payments still ahead */
  expected: number;
  /** «Сальдо»: the payments less the money invested */
  balance: number;
  /** «Дохід»: coupons plus what the redemptions brought over the cost of the bonds repaid */
  income: number;
  /** Every month of the period, the earliest first */
  months: MonthFlows[];
  /** Bonds with a purchase or a payment in the period, in wallet order */
  bonds: BondReport[];
  highlights: BondHighlights;
};

function flows(events: ScheduleEvent[]): Flows {
  return {
    invested: sumTotals(events.filter((event) => event.type === 'purchase')),
    coupons: sumTotals(events.filter((event) => event.type === 'coupon')),
    redemptions: sumTotals(events.filter((event) => event.type === 'redemption')),
  };
}

function bondHighlights(bonds: BondReport[]): BondHighlights {
  const byYield = bonds
    .filter((bond) => bond.annualYield !== null)
    .sort((first, second) => (second.annualYield ?? 0) - (first.annualYield ?? 0));
  const byIncome = [...bonds].sort((first, second) => second.income - first.income);
  const highestIncome = byIncome.length > 1 && byIncome[0].income > 0 ? byIncome[0] : undefined;
  return {
    highestYield: byYield.length > 1 ? byYield[0] : undefined,
    lowestYield: byYield.length > 1 ? byYield.at(-1) : undefined,
    highestIncome,
  };
}

/** The wallet's purchases and payments from one date to another, both included, per currency. */
export function periodReport(wallet: Wallet, from: string, to: string): CurrencyReport[] {
  const inPeriod = (event: { date: string }) => event.date >= from && event.date <= to;
  const events: ScheduleEvent[] = [...wallet.payments, ...wallet.purchaseEvents].filter(inPeriod);
  const months = monthsBetween(from, to);

  return CURRENCIES.flatMap((currency) => {
    const inCurrency = events.filter((event) => event.currency === currency);
    if (!inCurrency.length) return [];
    const payments = inCurrency.filter(
      (event): event is PositionPayment => event.type !== 'purchase',
    );
    const total = flows(inCurrency);
    const totalPayments = round2(total.coupons + total.redemptions);
    const bonds = wallet.positions
      .filter((item) => item.currency === currency)
      .flatMap((item): Omit<BondReport, 'incomeShare'>[] => {
        const bondEvents = inCurrency.filter((event) => event.isin === item.position.isin);
        if (!bondEvents.length) return [];
        return [
          {
            isin: item.position.isin,
            ...flows(bondEvents),
            income: positionIncome(item, from, to),
            annualYield: item.annualYield,
          },
        ];
      });

    const income = round2(bonds.reduce((sum, bond) => sum + bond.income, 0));
    const withShares = bonds.map((bond): BondReport => ({
      ...bond,
      incomeShare: income > 0 && bond.income > 0 ? round2((bond.income / income) * 100) : null,
    }));

    return [
      {
        currency,
        ...total,
        totalPayments,
        received: sumTotals(payments.filter((payment) => payment.isPaid)),
        expected: sumTotals(payments.filter((payment) => !payment.isPaid)),
        balance: round2(totalPayments - total.invested),
        income,
        months: months.map((month) => ({
          month,
          ...flows(inCurrency.filter((event) => event.date.startsWith(month))),
        })),
        bonds: withShares,
        highlights: bondHighlights(withShares),
      },
    ];
  });
}
