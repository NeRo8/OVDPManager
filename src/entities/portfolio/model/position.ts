import { round2 } from '@/shared/lib';

import {
  type Bond,
  CURRENCIES,
  type Currency,
  type Position,
  type PositionPayment,
  type Purchase,
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
  /** «Річна дохідність» of the Positions that have one, weighted by what they cost */
  annualYield: number | null;
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
};

/** The NBU has published the redemption, so the payments are all there. */
export function hasRedemption(bond: Bond): boolean {
  return bond.payments.some((payment) => payment.type === 'redemption');
}

function withNetIncome(
  sums: Omit<PositionResults, 'netIncome' | 'returnPercent'>,
): PositionResults {
  const netIncome = sums.complete ? round2(sums.totalPayments - sums.invested) : null;
  return {
    ...sums,
    netIncome,
    returnPercent:
      netIncome !== null && sums.invested ? round2((netIncome / sums.invested) * 100) : null,
  };
}

function positionResults(position: Position, bond: Bond, payments: PositionPayment[]) {
  const coupons = sumTotals(payments.filter((payment) => payment.type === 'coupon'));
  const redemption = sumTotals(payments.filter((payment) => payment.type === 'redemption'));
  return withNetIncome({
    invested: position.investedAmount,
    coupons,
    redemption,
    received: sumTotals(payments.filter((payment) => payment.isPaid)),
    expected: sumTotals(payments.filter((payment) => !payment.isPaid)),
    totalPayments: round2(coupons + redemption),
    complete: hasRedemption(bond),
  });
}

/**
 * «Річна дохідність» of a position: each purchase's yield weighted by the amount paid. Null while
 * NBU has not published the redemption, as the payments fall short.
 */
function positionYield(position: Position, bond: Bond, today: string): number | null {
  if (!hasRedemption(bond)) return null;
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
  };
}

/**
 * The nominal of one bond not yet repaid on a date. A redemption on that day goes to the previous
 * owner, as any payment does.
 */
function nominalLeft(bond: Bond, date: string): number {
  return bond.payments
    .filter((payment) => payment.type === 'redemption' && payment.date <= date)
    .reduce((left, payment) => left - payment.amount, bond.nominal);
}

/**
 * What the bonds a redemption repays cost: of each purchase held on its date, the share of what
 * was left of the nominal when it was bought that the redemption repays (all of it for a bond
 * redeemed at once). A purchase's redemptions so add up to what it cost, a top-up between partial
 * redemptions too.
 */
function redemptionCost(purchases: Purchase[], payment: PositionPayment, bond: Bond): number {
  return purchases
    .filter((purchase) => purchase.purchaseDate < payment.date)
    .reduce(
      (total, purchase) =>
        total + (purchase.amount * payment.amount) / nominalLeft(bond, purchase.purchaseDate),
      0,
    );
}

/**
 * «Дохід» of a Position from one date to another, both included: its coupons plus what its
 * redemptions brought over the cost of the bonds they repay.
 */
export function positionIncome(
  { position, bond, payments }: WalletPosition,
  from: string,
  to: string,
) {
  if (!bond) return 0;
  const inSpan = payments.filter((payment) => payment.date >= from && payment.date <= to);
  const coupons = sumTotals(inSpan.filter((payment) => payment.type === 'coupon'));
  const gains = inSpan
    .filter((payment) => payment.type === 'redemption')
    .reduce(
      (sum, payment) => sum + payment.total - redemptionCost(position.purchases, payment, bond),
      0,
    );
  return round2(coupons + gains);
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
    const published = results.filter((item) => item.complete);
    // The net income and the return over the term of the Positions with every payment known.
    const { netIncome, returnPercent } = withNetIncome({
      invested: sum(published, (item) => item.invested),
      coupons: 0,
      redemption: 0,
      received: 0,
      expected: 0,
      totalPayments: sum(published, (item) => item.totalPayments),
      complete: published.length > 0,
    });
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
        complete: published.length === results.length,
        netIncome,
        returnPercent,
        incompleteCount: results.length - published.length,
        annualYield: yieldWeight
          ? round2(
              withYield.reduce((total, item) => total + item.annualYield * item.invested, 0) /
                yieldWeight,
            )
          : null,
      },
    ];
  });
}
