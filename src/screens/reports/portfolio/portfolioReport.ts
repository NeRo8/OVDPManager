import { CURRENCIES, type Bond, type Currency } from '@/lib/portfolio/portfolio';
import {
  type CurrencyResults,
  type PositionResults,
  type PositionState,
  resultsByCurrency,
} from '@/lib/portfolio/position';
import type { Wallet } from '@/lib/portfolio/wallet';
import { round2 } from '@/utils/number';

export type PortfolioStatus = 'all' | 'inCirculation' | 'redeemed';

export type PortfolioBond = {
  isin: string;
  bond?: Bond;
  state: PositionState;
  quantity: number;
  invested: number;
  planned: number;
  results?: PositionResults;
  annualYield: number | null;
  investedShare: number | null;
};

export type CurrencyPortfolio = {
  currency: Currency;
  total: CurrencyResults;
  planned: number;
  bonds: PortfolioBond[];
  unknownCount: number;
};

/** Sold positions remain in history but are neither in circulation nor redeemed. */
export function passesStatus(state: PositionState, status: PortfolioStatus): boolean {
  if (status === 'all') return true;
  if (status === 'redeemed') return state === 'redeemed';
  return state === 'inCirculation' || state === 'planned' || state === 'unknown';
}

/** Portfolio results use the same operations and payment calculations as the plan. */
export function portfolioReport(wallet: Wallet, status: PortfolioStatus): CurrencyPortfolio[] {
  return CURRENCIES.flatMap((currency): CurrencyPortfolio[] => {
    const positions = wallet.positions.filter(
      (item) => item.currency === currency && passesStatus(item.state, status),
    );
    if (!positions.length) return [];

    const total = resultsByCurrency(positions)[0];
    const invested = total.invested;
    return [
      {
        currency,
        total,
        planned: round2(positions.reduce((sum, item) => sum + item.planned.amount, 0)),
        bonds: positions
          .map(({ position, bond, state, results, annualYield, planned }): PortfolioBond => ({
            isin: position.isin,
            bond,
            state,
            quantity: position.quantity,
            invested: position.investedAmount,
            planned: planned.amount,
            results,
            annualYield,
            investedShare: invested > 0 ? round2((position.investedAmount / invested) * 100) : null,
          }))
          .sort((a, b) =>
            (a.bond?.maturityDate ?? '9999').localeCompare(b.bond?.maturityDate ?? '9999'),
          ),
        unknownCount: positions.filter(({ state }) => state === 'unknown').length,
      },
    ];
  });
}
