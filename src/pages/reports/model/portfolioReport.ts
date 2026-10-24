import {
  type Bond,
  CURRENCIES,
  type Currency,
  type CurrencyResults,
  type PositionResults,
  type PositionState,
  type Wallet,
  resultsByCurrency,
} from '@/entities/portfolio';
import type { PortfolioStatus } from '@/features/report-filters';
import { round2 } from '@/shared/lib';

/** One bond of the wallet held to maturity. */
export type PortfolioBond = {
  isin: string;
  /** Missing when the NBU data has no such bond */
  bond?: Bond;
  state: PositionState;
  quantity: number;
  invested: number;
  /** Its payments and net income; missing without the NBU data */
  results?: PositionResults;
  /** «Річна дохідність»; null until NBU publishes the redemption */
  annualYield: number | null;
  /** Its share of what the currency's bonds cost, % */
  investedShare: number;
};

/** The wallet's bonds in one currency. */
export type CurrencyPortfolio = {
  currency: Currency;
  /** The bonds the NBU data has, summed up; missing when it has none of them */
  total?: CurrencyResults;
  /** By maturity, those missing from the NBU data last */
  bonds: PortfolioBond[];
  /** Bonds missing from the NBU data, left out of the total */
  unknownCount: number;
};

/** In circulation means everything not redeemed: planned, and unknown without the NBU data. */
export const passesStatus = (state: PositionState, status: PortfolioStatus) =>
  status === 'all' || (status === 'redeemed') === (state === 'redeemed');

/** The wallet's bonds in the status picked, per currency, each with what it costs and earns. */
export function portfolioReport(wallet: Wallet, status: PortfolioStatus): CurrencyPortfolio[] {
  return CURRENCIES.flatMap((currency): CurrencyPortfolio[] => {
    const inCurrency = wallet.positions.filter(
      (item) => item.currency === currency && passesStatus(item.state, status),
    );
    if (!inCurrency.length) return [];
    const invested = inCurrency.reduce((sum, item) => sum + item.position.investedAmount, 0);

    return [
      {
        currency,
        total: resultsByCurrency(inCurrency).at(0),
        bonds: inCurrency
          .map(({ position, bond, state, results, annualYield }): PortfolioBond => ({
            isin: position.isin,
            bond,
            state,
            quantity: position.quantity,
            invested: position.investedAmount,
            results,
            annualYield,
            investedShare: invested > 0 ? round2((position.investedAmount / invested) * 100) : 0,
          }))
          .sort((first, second) =>
            (first.bond?.maturityDate ?? '9999').localeCompare(second.bond?.maturityDate ?? '9999'),
          ),
        unknownCount: inCurrency.filter(({ state }) => state === 'unknown').length,
      },
    ];
  });
}
