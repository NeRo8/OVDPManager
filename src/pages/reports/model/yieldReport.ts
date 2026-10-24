import {
  type Bond,
  CURRENCIES,
  type Currency,
  type PositionState,
  type Purchase,
  type Wallet,
  resultsByCurrency,
} from '@/entities/portfolio';
import type { PortfolioStatus } from '@/features/report-filters';
import { round2 } from '@/shared/lib';
import { passesStatus } from './portfolioReport';

/** The NBU key rate is the hryvnia's: only hryvnia bonds compare with it. */
export const KEY_RATE_CURRENCY: Currency = 'UAH';

/** The NBU key rate on a date, null until it has loaded. */
export type KeyRateOn = (date: string) => number | null;

/** One bond's yield held to maturity. */
export type YieldBond = {
  isin: string;
  /** Missing when the NBU data has no such bond */
  bond?: Bond;
  state: PositionState;
  invested: number;
  /** «Річна дохідність»; null until NBU publishes the redemption */
  annualYield: number | null;
  /** The key rate on its purchase dates, weighted by amount; null for another currency or until loaded */
  keyRateAtPurchase: number | null;
};

/** The yield of one currency's bonds. */
export type CurrencyYield = {
  currency: Currency;
  /** «Річна дохідність» of the bonds that have one, weighted by what they cost; null when none has */
  averageYield: number | null;
  /** The coupon rate of the bonds the NBU data has, weighted by what they cost */
  averageRate: number | null;
  /** The key rate today, for hryvnia bonds; null for another currency or until loaded */
  keyRate: number | null;
  /** The highest yield first, those without one last */
  bonds: YieldBond[];
  /** Bonds left out of the average: no NBU data or no redemption published yet */
  withoutYield: number;
};

/** The average of the values that are there, weighted. */
function weightedAverage(items: { value: number | null; weight: number }[]): number | null {
  const known = items.filter(
    (item): item is { value: number; weight: number } => item.value !== null,
  );
  const weight = known.reduce((sum, item) => sum + item.weight, 0);
  if (!weight) return null;
  return round2(known.reduce((sum, item) => sum + item.value * item.weight, 0) / weight);
}

/** Every purchase date of the wallet: the key rates the report asks for. */
export function purchaseDates(wallet: Wallet): string[] {
  return wallet.purchases.map((purchase) => purchase.purchaseDate);
}

/** The key rate on the purchase dates, weighted by amount; null until each has loaded. */
export function keyRateAt(purchases: Purchase[], keyRateOn: KeyRateOn): number | null {
  const rates = purchases.map((purchase) => keyRateOn(purchase.purchaseDate));
  if (rates.some((rate) => rate === null)) return null;
  return weightedAverage(
    purchases.map((purchase, index) => ({ value: rates[index], weight: purchase.amount })),
  );
}

/**
 * The yield of the wallet's bonds in the status picked, per currency, next to the NBU key rate:
 * today's for the whole, the one on its purchase dates for each bond.
 */
export function yieldReport(
  wallet: Wallet,
  status: PortfolioStatus,
  keyRateOn: KeyRateOn,
): CurrencyYield[] {
  const { today } = wallet;

  return CURRENCIES.flatMap((currency): CurrencyYield[] => {
    const items = wallet.positions.filter(
      (item) => item.currency === currency && passesStatus(item.state, status),
    );
    if (!items.length) return [];
    const comparesWithKeyRate = currency === KEY_RATE_CURRENCY;

    const bonds = items
      .map((item): YieldBond => ({
        isin: item.position.isin,
        bond: item.bond,
        state: item.state,
        invested: item.position.investedAmount,
        annualYield: item.annualYield,
        keyRateAtPurchase: comparesWithKeyRate
          ? keyRateAt(item.position.purchases, keyRateOn)
          : null,
      }))
      .sort(
        (first, second) => (second.annualYield ?? -Infinity) - (first.annualYield ?? -Infinity),
      );

    return [
      {
        currency,
        // The same average the plan tab shows, over the bonds the status keeps.
        averageYield: resultsByCurrency(items).at(0)?.annualYield ?? null,
        averageRate: weightedAverage(
          bonds.map(({ bond, invested }) => ({ value: bond?.rate ?? null, weight: invested })),
        ),
        keyRate: comparesWithKeyRate ? keyRateOn(today) : null,
        bonds,
        withoutYield: bonds.filter(({ annualYield }) => annualYield === null).length,
      },
    ];
  });
}
