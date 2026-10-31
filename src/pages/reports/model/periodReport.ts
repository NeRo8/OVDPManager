import {
  CURRENCIES,
  type Currency,
  type PositionPayment,
  type ScheduleEvent,
  type Wallet,
  positionIncome,
  resultsByCurrency,
  sumTotals,
} from '@/entities/portfolio';

import { monthsBetween, monthsInSpan, round2 } from '@/shared/lib';

/** Money that went out and came in. */
export type Flows = {
  /** Paid for purchases, planned ones included */
  invested: number;
  /** The part of `invested` that is planned purchases, dated after today */
  planned: number;
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
  /** Whether the NBU catalog contains this bond. */
  hasBondData: boolean;
  /** Coupons plus what the redemptions brought over the cost of the bonds repaid */
  income: number;
  /** «Річна дохідність» of the bond held to maturity; null until NBU publishes its redemption */
  annualYield: number | null;
  /**
   * Its income as % of what the bonds with income above zero brought together; null unless its
   * own is above zero. A loss elsewhere does not push the shares past 100 %.
   */
  incomeShare: number | null;
};

/** The bonds with the highest and the lowest yield; left out when there are not two to compare. */
export type BondHighlights = {
  highestYield?: BondReport;
  lowestYield?: BondReport;
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
  /** How many months the period lasts, a month it covers in part as its share of days */
  monthCount: number;
  /** The coupons over `monthCount`; redemptions return the money put in */
  averageMonthlyCoupons: number;
  /** «Річна дохідність» of the period's bonds, averaged by what they cost; null when none is known */
  annualYield: number | null;
  /** Every month of the period, the earliest first */
  months: MonthFlows[];
  /** Bonds with a purchase or a payment in the period, in wallet order */
  bonds: BondReport[];
  highlights: BondHighlights;
};

function flows(events: ScheduleEvent[], today: string): Flows {
  const purchases = events.filter((event) => event.type === 'purchase');
  return {
    invested: sumTotals(purchases),
    planned: sumTotals(purchases.filter((event) => event.date > today)),
    coupons: sumTotals(events.filter((event) => event.type === 'coupon')),
    redemptions: sumTotals(events.filter((event) => event.type === 'redemption')),
  };
}

function bondHighlights(bonds: BondReport[]): BondHighlights {
  const byYield = bonds
    .filter((bond) => bond.annualYield !== null)
    .sort((first, second) => (second.annualYield ?? 0) - (first.annualYield ?? 0));
  return {
    highestYield: byYield.length > 1 ? byYield[0] : undefined,
    lowestYield: byYield.length > 1 ? byYield.at(-1) : undefined,
  };
}

/** The wallet's purchases and payments from one date to another, both included, per currency. */
export function periodReport(wallet: Wallet, from: string, to: string): CurrencyReport[] {
  const inPeriod = (event: { date: string }) => event.date >= from && event.date <= to;
  const events: ScheduleEvent[] = [...wallet.payments, ...wallet.purchaseEvents].filter(inPeriod);
  const months = monthsBetween(from, to);
  const monthCount = round2(monthsInSpan(from, to));

  return CURRENCIES.flatMap((currency) => {
    const inCurrency = events.filter((event) => event.currency === currency);
    if (!inCurrency.length) return [];
    const payments = inCurrency.filter(
      (event): event is PositionPayment => event.type !== 'purchase',
    );
    const total = flows(inCurrency, wallet.today);
    const totalPayments = round2(total.coupons + total.redemptions);
    const positions = wallet.positions.filter(
      (item) =>
        item.currency === currency && inCurrency.some((event) => event.isin === item.position.isin),
    );
    const bonds = positions.map((item): Omit<BondReport, 'incomeShare'> => {
      const bondEvents = inCurrency.filter((event) => event.isin === item.position.isin);
      return {
        isin: item.position.isin,
        hasBondData: !!item.bond,
        ...flows(bondEvents, wallet.today),
        income: positionIncome(item, from, to),
        annualYield: item.annualYield,
      };
    });

    const income = round2(bonds.reduce((sum, bond) => sum + bond.income, 0));
    const earned = bonds.reduce((sum, bond) => sum + Math.max(0, bond.income), 0);
    const withShares = bonds.map((bond): BondReport => ({
      ...bond,
      incomeShare: bond.income > 0 ? round2((bond.income / earned) * 100) : null,
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
        monthCount,
        averageMonthlyCoupons: round2(total.coupons / monthCount),
        annualYield: resultsByCurrency(positions)[0]?.annualYield ?? null,
        months: months.map((month) => ({
          month,
          ...flows(
            inCurrency.filter((event) => event.date.startsWith(month)),
            wallet.today,
          ),
        })),
        bonds: withShares,
        highlights: bondHighlights(withShares),
      },
    ];
  });
}
