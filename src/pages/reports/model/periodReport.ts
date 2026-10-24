import {
  type Bond,
  CURRENCIES,
  type Currency,
  type PositionPayment,
  type Purchase,
  type ScheduleEvent,
  type Wallet,
  type WalletPosition,
  annualYield,
  positionPayments,
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

/** The bonds that stand out in the period; each is left out when there are not two to compare. */
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

/**
 * What the bonds a redemption repays cost: the amount paid for those held on its date, scaled by
 * the share of the nominal it repays (all of it for a bond redeemed at once).
 */
function redemptionCost(purchases: Purchase[], payment: PositionPayment, bond: Bond): number {
  const paid = purchases
    .filter((purchase) => purchase.purchaseDate < payment.date)
    .reduce((total, purchase) => total + purchase.amount, 0);
  return (paid * payment.amount) / bond.nominal;
}

/** What a redemption brought over the cost of the bonds it repays. */
function redemptionGain(purchases: Purchase[], payment: PositionPayment, bond: Bond): number {
  return payment.total - redemptionCost(purchases, payment, bond);
}

/**
 * «Річна дохідність» of a position: each purchase's yield, as the purchase form shows it, weighted
 * by the amount paid. Null while NBU has not published the redemption, as the payments fall short.
 */
function positionYield({ position, bond }: WalletPosition, today: string): number | null {
  if (!bond?.payments.some((payment) => payment.type === 'redemption')) return null;
  let weighted = 0;
  for (const purchase of position.purchases) {
    const payments = positionPayments([purchase], bond, today);
    const yearly = annualYield(purchase.amount, purchase.purchaseDate, payments);
    if (yearly === null) return null;
    weighted += yearly * purchase.amount;
  }
  return round2(weighted / position.investedAmount);
}

function bondHighlights(bonds: BondReport[]): BondHighlights {
  const byYield = bonds
    .filter((bond) => bond.annualYield !== null)
    .sort((first, second) => (second.annualYield ?? 0) - (first.annualYield ?? 0));
  const byIncome = [...bonds].sort((first, second) => second.income - first.income);
  return {
    highestYield: byYield.length > 1 ? byYield[0] : undefined,
    lowestYield: byYield.length > 1 ? byYield.at(-1) : undefined,
    highestIncome: byIncome.length > 1 ? byIncome[0] : undefined,
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
        const { position, bond } = item;
        const bondEvents = inCurrency.filter((event) => event.isin === position.isin);
        if (!bondEvents.length) return [];
        const bondFlows = flows(bondEvents);
        const gains = bond
          ? item.payments
              .filter((payment) => payment.type === 'redemption' && inPeriod(payment))
              .map((payment) => redemptionGain(position.purchases, payment, bond))
          : [];
        return [
          {
            isin: position.isin,
            ...bondFlows,
            income: round2(bondFlows.coupons + gains.reduce((sum, gain) => sum + gain, 0)),
            annualYield: positionYield(item, wallet.today),
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
