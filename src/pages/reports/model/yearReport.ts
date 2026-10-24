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
import { MONTHS, round2 } from '@/shared/lib';

/** Money that went out and came in. */
export type YearFlows = {
  /** Paid for purchases, planned ones included */
  invested: number;
  coupons: number;
  redemptions: number;
};

/** One bond's purchases and payments in the year. */
export type BondYear = YearFlows & {
  isin: string;
  /** Coupons plus what the redemptions brought over the cost of the bonds repaid */
  income: number;
  /** «Річна дохідність» of the bond held to maturity; null until NBU publishes its redemption */
  annualYield: number | null;
  /** Its income as % of the year's income in the currency; null unless both are above zero */
  incomeShare: number | null;
};

/** The bonds that stand out in the year; each is left out when there are not two to compare. */
export type BondHighlights = {
  highestYield?: BondYear;
  lowestYield?: BondYear;
  highestIncome?: BondYear;
};

/** One year of the wallet in one currency. */
export type CurrencyYear = YearFlows & {
  currency: Currency;
  /** Coupons plus redemptions */
  totalPayments: number;
  /** Payments already received */
  received: number;
  /** Payments still ahead */
  expected: number;
  /** «Сальдо року»: the payments less the money invested */
  balance: number;
  /** «Дохід за рік»: coupons plus what the redemptions brought over the cost of the bonds repaid */
  income: number;
  /** Per month, January first */
  months: YearFlows[];
  /** Bonds with a purchase or a payment in the year, in wallet order */
  bonds: BondYear[];
  highlights: BondHighlights;
};

const yearOf = (date: string) => Number(date.slice(0, 4));
const monthOf = (date: string) => Number(date.slice(5, 7)) - 1;

function flows(events: ScheduleEvent[]): YearFlows {
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

function bondHighlights(bonds: BondYear[]): BondHighlights {
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

/** The years the report can show: from the wallet's first purchase or payment to its last. */
export function reportYears({ payments, purchaseEvents, today }: Wallet) {
  const currentYear = yearOf(today);
  const years = [...payments, ...purchaseEvents].map((event) => yearOf(event.date));
  const firstYear = years.length ? Math.min(...years) : currentYear;
  const lastYear = years.length ? Math.max(...years) : currentYear;
  return { firstYear, lastYear, currentYear };
}

/** The wallet's purchases and payments in one year, summed up per currency. */
export function yearReport(wallet: Wallet, year: number): CurrencyYear[] {
  const inYear = (event: { date: string }) => yearOf(event.date) === year;
  const events: ScheduleEvent[] = [...wallet.payments, ...wallet.purchaseEvents].filter(inYear);

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
      .flatMap((item): Omit<BondYear, 'incomeShare'>[] => {
        const { position, bond } = item;
        const bondEvents = inCurrency.filter((event) => event.isin === position.isin);
        if (!bondEvents.length) return [];
        const bondFlows = flows(bondEvents);
        const gains = bond
          ? item.payments
              .filter((payment) => payment.type === 'redemption' && inYear(payment))
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
    const withShares = bonds.map((bond): BondYear => ({
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
        months: MONTHS.map((_, month) =>
          flows(inCurrency.filter((event) => monthOf(event.date) === month)),
        ),
        bonds: withShares,
        highlights: bondHighlights(withShares),
      },
    ];
  });
}
