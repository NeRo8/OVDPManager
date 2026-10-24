import {
  type Bond,
  CURRENCIES,
  type Currency,
  type Wallet,
  isPlannedPurchase,
} from '@/entities/portfolio';
import type { StructurePurchases } from '@/features/report-filters';
import { addDaysISO, addMonthsISO, daysBetween, round2 } from '@/shared/lib';

/** Time left until maturity, the bond picker's one and three years split finer. */
export type TermBucket = 'halfYear' | 'year' | 'twoYears' | 'threeYears' | 'longer';

export const TERM_BUCKETS: TermBucket[] = ['halfYear', 'year', 'twoYears', 'threeYears', 'longer'];

/** What part of the money something holds. */
export type MoneyShare = {
  amount: number;
  /** Of the currency's money in bonds, % */
  share: number;
};

export type TermShare = MoneyShare & {
  term: TermBucket;
  /** Bonds in it */
  count: number;
};

export type StructureBond = MoneyShare & {
  isin: string;
  bond: Bond;
};

/** The money in one currency's bonds, split up. */
export type CurrencyStructure = {
  currency: Currency;
  /** What the bonds still in circulation cost */
  total: number;
  /** The day the money stays in bonds on average, weighted by amount */
  averageMaturity: string;
  /** The coupon rate weighted by amount, % */
  averageRate: number;
  /** Every bucket, empty ones too, so the split reads the same each time */
  terms: TermShare[];
  /** The largest share first */
  bonds: StructureBond[];
};

/** The wallet's money in bonds per currency; another currency's sum cannot be added without a rate. */
export type StructureReport = {
  currencies: CurrencyStructure[];
  /** Bonds missing from the NBU data: no maturity to place them by */
  unknownCount: number;
};

function termOf(maturityDate: string, today: string): TermBucket {
  if (maturityDate <= addMonthsISO(today, 6)) return 'halfYear';
  if (maturityDate <= addMonthsISO(today, 12)) return 'year';
  if (maturityDate <= addMonthsISO(today, 24)) return 'twoYears';
  if (maturityDate <= addMonthsISO(today, 36)) return 'threeYears';
  return 'longer';
}

/**
 * How the money in the wallet's bonds still in circulation splits up, per currency: by time left
 * to maturity and by bond. The money is what the purchases cost, planned ones too unless `made`.
 */
export function structureReport(wallet: Wallet, purchases: StructurePurchases): StructureReport {
  const { today } = wallet;
  // Without the NBU data a bond has no payments, so it counts as still in circulation.
  const inCirculation = wallet.positions.filter(({ bond, nextPayment }) => !bond || nextPayment);
  const held = inCirculation.flatMap(({ position, bond, currency }) => {
    if (!bond) return [];
    const amount = position.purchases
      .filter((purchase) => purchases === 'all' || !isPlannedPurchase(purchase, today))
      .reduce((sum, purchase) => sum + purchase.amount, 0);
    return amount > 0 ? [{ isin: position.isin, bond, currency, amount }] : [];
  });

  const currencies = CURRENCIES.flatMap((currency): CurrencyStructure[] => {
    const bonds = held.filter((item) => item.currency === currency);
    if (!bonds.length) return [];
    const total = round2(bonds.reduce((sum, { amount }) => sum + amount, 0));
    const shareOf = (amount: number) => round2((amount / total) * 100);
    const weighted = (value: (bond: Bond) => number) =>
      bonds.reduce((sum, { bond, amount }) => sum + value(bond) * amount, 0) / total;

    return [
      {
        currency,
        total,
        averageMaturity: addDaysISO(
          today,
          Math.round(weighted((bond) => daysBetween(today, bond.maturityDate))),
        ),
        averageRate: round2(weighted((bond) => bond.rate)),
        terms: TERM_BUCKETS.map((term) => {
          const inTerm = bonds.filter(({ bond }) => termOf(bond.maturityDate, today) === term);
          const amount = round2(inTerm.reduce((sum, item) => sum + item.amount, 0));
          return { term, amount, share: shareOf(amount), count: inTerm.length };
        }),
        bonds: bonds
          .map(({ isin, bond, amount }) => ({ isin, bond, amount, share: shareOf(amount) }))
          .sort((first, second) => second.amount - first.amount),
      },
    ];
  });

  return { currencies, unknownCount: inCirculation.filter(({ bond }) => !bond).length };
}
