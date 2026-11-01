import { formatMoney, round2 } from '@/shared/lib';

import {
  type Bond,
  CURRENCIES,
  type Currency,
  type Position,
  type PositionPayment,
  isPlannedPurchase,
  isRedeemed,
  nextPayment,
  positionCurrency,
  positionPayments,
  sumTotals,
} from './portfolio';
import { annualYield } from './yield';

/**
 * Where a Position stands: every purchase still ahead, in circulation, redeemed (its maturity date
 * behind today), or unknown without the NBU data.
 */
export type PositionState = 'planned' | 'inCirculation' | 'redeemed' | 'unknown';

/** What purchases cost and earn, held to maturity. */
export type PositionResults = {
  invested: number;
  coupons: number;
  redemption: number;
  /** Payments already received */
  received: number;
  /** Payments still ahead */
  expected: number;
  /** Coupons plus redemption */
  totalPayments: number;
  /** False while NBU has not published the redemption: the payments fall short */
  complete: boolean;
  /** Total payments minus invested; null while the payments are incomplete */
  netIncome: number | null;
  /** Net income as % of invested, for the whole term; null while the payments are incomplete */
  returnPercent: number | null;
};

/**
 * The results of a currency's Positions summed up. `invested` is what all of them cost; the
 * payments come from those in the NBU data, and the net income and the return over the term only
 * from those whose redemption NBU has published, so one still waiting for it does not hide the
 * rest. `complete` says whether every payment of every Position is known.
 */
export type CurrencyResults = PositionResults & {
  currency: Currency;
  /** Positions whose redemption NBU has not published yet, left out of the net income */
  incompleteCount: number;
  /** Positions missing from the NBU data: in `invested`, but with no payments */
  withoutDataCount: number;
  /**
   * What the net income is worked out from: the cost and the payments of the Positions whose
   * redemption is published. They match `invested` and `totalPayments` when `complete`.
   */
  published: { invested: number; totalPayments: number };
  /** «Річна дохідність» of the Positions that have one, weighted by what they cost */
  annualYield: number | null;
  /** Positions in this currency omitted from the annual-yield average. */
  withoutYieldCount: number;
};

/** A Position of the Wallet joined with the NBU data, and what it comes to. */
export type WalletPosition = {
  position: Position;
  /** Missing when the NBU data has no such bond */
  bond?: Bond;
  currency: Currency;
  /** What the Position is entitled to; empty without the NBU data */
  payments: PositionPayment[];
  nextPayment?: PositionPayment;
  state: PositionState;
  /** Missing without the NBU data */
  results?: PositionResults;
  /**
   * «Річна дохідність» of the purchases that have one, weighted by what they cost; null until NBU
   * publishes the redemption, or when no purchase has one
   */
  annualYield: number | null;
  /** What the purchases in `annualYield` cost: its weight in an average over several Positions */
  annualYieldBasis: number;
  /** Purchases left out of `annualYield`, as no yield `annualYield` can find fits their price */
  purchasesWithoutYield: number;
  /** Its purchases still planned (dated after today), together; zero when all are made */
  planned: { quantity: number; amount: number };
};

/** The NBU has published the redemption, so the payments are all there. */
export function hasRedemption(bond: Bond): boolean {
  return bond.payments.some((payment) => payment.type === 'redemption');
}

/** The payments minus what they cost, and that as % of the cost; null while incomplete. */
function netIncomeOf(
  { invested, totalPayments }: { invested: number; totalPayments: number },
  complete: boolean,
): Pick<PositionResults, 'netIncome' | 'returnPercent'> {
  if (!complete) return { netIncome: null, returnPercent: null };
  const netIncome = round2(totalPayments - invested);
  return { netIncome, returnPercent: invested ? round2((netIncome / invested) * 100) : null };
}

function positionResults(
  position: Position,
  bond: Bond,
  payments: PositionPayment[],
): PositionResults {
  const coupons = sumTotals(payments.filter((payment) => payment.type === 'coupon'));
  const redemption = sumTotals(payments.filter((payment) => payment.type === 'redemption'));
  const invested = position.investedAmount;
  const totalPayments = round2(coupons + redemption);
  const complete = hasRedemption(bond);
  return {
    invested,
    coupons,
    redemption,
    received: sumTotals(payments.filter((payment) => payment.isPaid)),
    expected: sumTotals(payments.filter((payment) => !payment.isPaid)),
    totalPayments,
    complete,
    ...netIncomeOf({ invested, totalPayments }, complete),
  };
}

type PositionYield = Pick<
  WalletPosition,
  'annualYield' | 'annualYieldBasis' | 'purchasesWithoutYield'
>;

const NO_YIELD: PositionYield = {
  annualYield: null,
  annualYieldBasis: 0,
  purchasesWithoutYield: 0,
};

/**
 * «Річна дохідність» of a position: each purchase's yield weighted by the amount paid. A purchase
 * without one (a price no yield in `ANNUAL_YIELD_RANGE` fits) is left out and counted, so it does
 * not hide the others'. Null while NBU has not published the redemption, as the payments fall
 * short, and when no purchase has a yield.
 */
function positionYield(position: Position, bond: Bond, today: string): PositionYield {
  if (!hasRedemption(bond)) return NO_YIELD;
  let weighted = 0;
  let weight = 0;
  let purchasesWithoutYield = 0;
  for (const purchase of position.purchases) {
    const payments = positionPayments([purchase], bond, today);
    const yearly = annualYield(purchase.amount, purchase.purchaseDate, payments);
    if (yearly === null) {
      purchasesWithoutYield += 1;
    } else {
      weighted += yearly * purchase.amount;
      weight += purchase.amount;
    }
  }
  return {
    annualYield: weight > 0 ? round2(weighted / weight) : null,
    annualYieldBasis: round2(weight),
    purchasesWithoutYield,
  };
}

function positionState(position: Position, bond: Bond | undefined, today: string): PositionState {
  if (!bond) return 'unknown';
  if (position.purchases.every((purchase) => isPlannedPurchase(purchase, today))) return 'planned';
  return isRedeemed(bond, today) ? 'redeemed' : 'inCirculation';
}

/** A Position joined with its bond from the NBU data, if it is there, as of today. */
export function walletPosition(
  position: Position,
  bond: Bond | undefined,
  today: string,
): WalletPosition {
  const payments = bond ? positionPayments(position.purchases, bond, today) : [];
  return {
    position,
    bond,
    currency: positionCurrency(position, bond),
    payments,
    nextPayment: nextPayment(payments),
    state: positionState(position, bond, today),
    results: bond && positionResults(position, bond, payments),
    ...(bond ? positionYield(position, bond, today) : NO_YIELD),
    planned: plannedPart(position, today),
  };
}

/** A Position's purchases still planned (dated after today), together. */
export function plannedPart(position: Position, today: string): WalletPosition['planned'] {
  const planned = position.purchases.filter((purchase) => isPlannedPurchase(purchase, today));
  return {
    quantity: planned.reduce((sum, purchase) => sum + purchase.quantity, 0),
    amount: round2(planned.reduce((sum, purchase) => sum + purchase.amount, 0)),
  };
}

/**
 * The results of the Positions summed up per currency, in `CURRENCIES` order, for every currency
 * the Positions have. A Position missing from the NBU data adds what it cost and is counted in
 * `withoutDataCount`; its payments are not known.
 */
export function resultsByCurrency(positions: WalletPosition[]): CurrencyResults[] {
  return CURRENCIES.flatMap((currency): CurrencyResults[] => {
    const ofCurrency = positions.filter((item) => item.currency === currency);
    if (!ofCurrency.length) return [];
    const known = ofCurrency.filter((item) => item.results);
    const results = known.flatMap(({ results }) => (results ? [results] : []));
    const sum = (items: PositionResults[], value: (item: PositionResults) => number) =>
      round2(items.reduce((total, item) => total + value(item), 0));
    const withRedemption = results.filter((item) => item.complete);
    const published = {
      invested: sum(withRedemption, (item) => item.invested),
      totalPayments: sum(withRedemption, (item) => item.totalPayments),
    };
    // The net income and the return over the term of the Positions with every payment known.
    const { netIncome, returnPercent } = netIncomeOf(published, withRedemption.length > 0);
    const withYield = known.flatMap(({ annualYield, annualYieldBasis }) =>
      annualYield === null ? [] : [{ annualYield, invested: annualYieldBasis }],
    );
    const yieldWeight = withYield.reduce((total, item) => total + item.invested, 0);
    return [
      {
        currency,
        invested: round2(
          ofCurrency.reduce((total, { position }) => total + position.investedAmount, 0),
        ),
        coupons: sum(results, (item) => item.coupons),
        redemption: sum(results, (item) => item.redemption),
        received: sum(results, (item) => item.received),
        expected: sum(results, (item) => item.expected),
        totalPayments: sum(results, (item) => item.totalPayments),
        complete: withRedemption.length === ofCurrency.length,
        netIncome,
        returnPercent,
        incompleteCount: results.length - withRedemption.length,
        withoutDataCount: ofCurrency.length - known.length,
        published,
        annualYield: yieldWeight
          ? round2(
              withYield.reduce((total, item) => total + item.annualYield * item.invested, 0) /
                yieldWeight,
            )
          : null,
        withoutYieldCount: ofCurrency.filter((item) => item.annualYield === null).length,
      },
    ];
  });
}

/**
 * Where the net income comes from when some Positions are left out of it: «Виплати 12 000,00 ₴
 * мінус вкладено 10 500,00 ₴, лише ОВДП з опублікованим погашенням». Nothing when none is left
 * out, as the sums shown above it then add up.
 */
export function netIncomeBasis({ currency, incompleteCount, published }: CurrencyResults) {
  if (incompleteCount === 0) return undefined;
  const money = (value: number) => formatMoney(value, currency);
  return `Виплати ${money(published.totalPayments)} мінус вкладено ${money(published.invested)}, лише ОВДП з опублікованим погашенням`;
}
