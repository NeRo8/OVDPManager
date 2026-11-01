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
 * The results of a currency's Positions summed up. The net income and the return over the term
 * cover only the Positions whose redemption NBU has published, so one still waiting for it does
 * not hide the rest; `complete` says whether that is all of them.
 */
export type CurrencyResults = PositionResults & {
  currency: Currency;
  /** Positions whose redemption NBU has not published yet, left out of the net income */
  incompleteCount: number;
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
  /** «Річна дохідність»; null until NBU publishes the redemption */
  annualYield: number | null;
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

/**
 * «Річна дохідність» of a position: each purchase's yield weighted by the amount paid. Null while
 * NBU has not published the redemption, as the payments fall short.
 */
function positionYield(position: Position, bond: Bond, today: string): number | null {
  if (!hasRedemption(bond) || position.investedAmount <= 0) return null;
  let weighted = 0;
  for (const purchase of position.purchases) {
    const payments = positionPayments([purchase], bond, today);
    const yearly = annualYield(purchase.amount, purchase.purchaseDate, payments);
    if (yearly === null) return null;
    weighted += yearly * purchase.amount;
  }
  return round2(weighted / position.investedAmount);
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
    annualYield: bond ? positionYield(position, bond, today) : null,
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
 * The results of the Positions summed up per currency, in `CURRENCIES` order. Positions missing
 * from the NBU data have none and are left out; a currency with none of the others is too.
 */
export function resultsByCurrency(positions: WalletPosition[]): CurrencyResults[] {
  return CURRENCIES.flatMap((currency): CurrencyResults[] => {
    const known = positions.filter((item) => item.currency === currency && item.results);
    const results = known.flatMap(({ results }) => (results ? [results] : []));
    if (!results.length) return [];
    const sum = (items: PositionResults[], value: (item: PositionResults) => number) =>
      round2(items.reduce((total, item) => total + value(item), 0));
    const withRedemption = results.filter((item) => item.complete);
    const published = {
      invested: sum(withRedemption, (item) => item.invested),
      totalPayments: sum(withRedemption, (item) => item.totalPayments),
    };
    // The net income and the return over the term of the Positions with every payment known.
    const { netIncome, returnPercent } = netIncomeOf(published, withRedemption.length > 0);
    const withYield = known.flatMap(({ annualYield, position }) =>
      annualYield === null ? [] : [{ annualYield, invested: position.investedAmount }],
    );
    const yieldWeight = withYield.reduce((total, item) => total + item.invested, 0);
    return [
      {
        currency,
        invested: sum(results, (item) => item.invested),
        coupons: sum(results, (item) => item.coupons),
        redemption: sum(results, (item) => item.redemption),
        received: sum(results, (item) => item.received),
        expected: sum(results, (item) => item.expected),
        totalPayments: sum(results, (item) => item.totalPayments),
        complete: withRedemption.length === results.length,
        netIncome,
        returnPercent,
        incompleteCount: results.length - withRedemption.length,
        published,
        annualYield: yieldWeight
          ? round2(
              withYield.reduce((total, item) => total + item.annualYield * item.invested, 0) /
                yieldWeight,
            )
          : null,
        withoutYieldCount: positions.filter(
          (item) => item.currency === currency && item.annualYield === null,
        ).length,
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
