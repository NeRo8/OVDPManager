import {
  type Bond,
  CURRENCIES,
  type Currency,
  type PurchaseResults,
  type Wallet,
  type WalletPosition,
  isPlannedPurchase,
  purchaseResults,
} from '@/entities/portfolio';
import type { PortfolioStatus } from '@/features/report-filters';
import { round2 } from '@/shared/lib';
import { positionYield } from './periodReport';

/**
 * Where a bond of the wallet stands: every purchase still ahead, payments still to come, all of
 * them received, or unknown without the NBU data.
 */
export type BondState = 'planned' | 'active' | 'redeemed' | 'unknown';

/** One bond of the wallet held to maturity. */
export type PortfolioBond = {
  isin: string;
  /** Missing when the NBU data has no such bond */
  bond?: Bond;
  state: BondState;
  quantity: number;
  invested: number;
  /** Its payments and net income; missing without the NBU data */
  results?: PurchaseResults;
  /** «Річна дохідність»; null until NBU publishes the redemption */
  annualYield: number | null;
  /** Its share of what the currency's bonds cost, % */
  investedShare: number;
};

/** The wallet's bonds in one currency. */
export type CurrencyPortfolio = {
  currency: Currency;
  /** The bonds the NBU data has, summed up; missing when it has none of them */
  total?: PurchaseResults;
  /** By maturity, those missing from the NBU data last */
  bonds: PortfolioBond[];
  /** Bonds missing from the NBU data, left out of the total */
  unknownCount: number;
};

/** Where a bond of the wallet stands today. */
export function bondState(
  { position, bond, nextPayment }: WalletPosition,
  today: string,
): BondState {
  if (!bond) return 'unknown';
  if (position.purchases.every((purchase) => isPlannedPurchase(purchase, today))) return 'planned';
  return nextPayment ? 'active' : 'redeemed';
}

/** In circulation means everything not redeemed: planned, and unknown without the NBU data. */
export const passesStatus = (state: BondState, status: PortfolioStatus) =>
  status === 'all' || (status === 'redeemed') === (state === 'redeemed');

/** The wallet's bonds in the status picked, per currency, each with what it costs and earns. */
export function portfolioReport(wallet: Wallet, status: PortfolioStatus): CurrencyPortfolio[] {
  const { byIsin, today } = wallet;
  const bonds = wallet.positions.map((item) => ({ item, state: bondState(item, today) }));

  return CURRENCIES.flatMap((currency): CurrencyPortfolio[] => {
    const inCurrency = bonds.filter(
      ({ item, state }) => item.currency === currency && passesStatus(state, status),
    );
    if (!inCurrency.length) return [];
    const invested = inCurrency.reduce((sum, { item }) => sum + item.position.investedAmount, 0);
    const purchases = inCurrency.flatMap(({ item }) => item.position.purchases);

    return [
      {
        currency,
        total: purchaseResults(purchases, byIsin, today).at(0),
        bonds: inCurrency
          .map(({ item, state }): PortfolioBond => {
            const { position, bond } = item;
            return {
              isin: position.isin,
              bond,
              state,
              quantity: position.quantity,
              invested: position.investedAmount,
              results: purchaseResults(position.purchases, byIsin, today).at(0),
              annualYield: positionYield(item, today),
              investedShare: invested > 0 ? round2((position.investedAmount / invested) * 100) : 0,
            };
          })
          .sort((first, second) =>
            (first.bond?.maturityDate ?? '9999').localeCompare(second.bond?.maturityDate ?? '9999'),
          ),
        unknownCount: inCurrency.filter(({ state }) => state === 'unknown').length,
      },
    ];
  });
}
