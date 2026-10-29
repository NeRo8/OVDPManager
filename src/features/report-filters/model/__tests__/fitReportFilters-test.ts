import { type Bond, type Purchase, buildWallet } from '@/entities/portfolio';

import { fitReportFilters } from '../fitReportFilters';
import { initialState } from '../reportFilters/store';

function bondOf(isin: string, currency: Bond['currency'], maturityDate: string): Bond {
  return {
    isin,
    nominal: 1000,
    rate: 10,
    currency,
    issueDate: '2024-01-01',
    maturityDate,
    description: '',
    payments: [
      { date: '2025-07-01', type: 'coupon', amount: 50 },
      { date: maturityDate, type: 'redemption', amount: 1000 },
    ],
  };
}

const later = bondOf('UA4000000001', 'UAH', '2027-06-01');
const sooner = bondOf('UA4000000002', 'USD', '2026-02-01');
const byIsin = new Map([later, sooner].map((bond) => [bond.isin, bond]));
const today = '2026-03-15';

let nextId = 0;
function purchase(bond: Bond, purchaseDate: string): Purchase {
  nextId += 1;
  return {
    id: String(nextId),
    isin: bond.isin,
    currency: bond.currency,
    purchaseDate,
    amount: 990,
    quantity: 1,
  };
}

const wallet = buildWallet(
  [purchase(later, '2025-01-10'), purchase(sooner, '2025-02-10')],
  byIsin,
  today,
);

describe('fitReportFilters', () => {
  it('starts the year report on this year, within the years the wallet spans', () => {
    const { filters, activeFilterCount } = fitReportFilters('year', initialState.year, wallet);
    expect(filters.years).toEqual({ firstYear: 2025, lastYear: 2027, defaultYear: 2026 });
    expect(filters.year).toBe(2026);
    expect(activeFilterCount).toBe(0);
  });

  it('shows all-time UAH bonds by default and fits optional past-year filters', () => {
    const fitted = fitReportFilters('fx', initialState.fx, wallet);
    expect(fitted.filters.years).toEqual({ firstYear: 2025, lastYear: 2026, defaultYear: 2026 });
    expect(fitted.filters.year).toBeNull();
    expect(fitted.activeFilterCount).toBe(0);
    expect(fitted.options.isins).toEqual([later.isin]);
    expect(fitted.narrowed.positions.map(({ position }) => position.isin)).toEqual([later.isin]);
    expect(
      fitReportFilters(
        'fx',
        { ...initialState.fx, year: 2025, targetCurrency: 'EUR', isins: [later.isin, sooner.isin] },
        wallet,
      ),
    ).toMatchObject({
      filters: { year: 2025, targetCurrency: 'EUR', isins: [later.isin] },
      activeFilterCount: 3,
    });
    expect(
      fitReportFilters('fx', { ...initialState.fx, year: 2031 }, wallet).filters.year,
    ).toBeNull();
  });

  it('keeps a saved year the wallet spans, and counts it; one it no longer spans gives way', () => {
    expect(fitReportFilters('year', { ...initialState.year, year: 2025 }, wallet)).toMatchObject({
      filters: { year: 2025 },
      activeFilterCount: 1,
    });
    expect(
      fitReportFilters('year', { ...initialState.year, year: 2031 }, wallet).filters.year,
    ).toBe(2026);
  });

  it('gives the period report the dates of its period, the last 12 months at first', () => {
    const { filters } = fitReportFilters('period', initialState.period, wallet);
    expect(filters.dates).toEqual({ from: '2025-03-16', to: today });
  });

  it('narrows the wallet to the currency and bonds picked, and counts them', () => {
    const { narrowed, activeFilterCount } = fitReportFilters(
      'portfolio',
      { ...initialState.portfolio, currency: 'USD', status: 'redeemed' },
      wallet,
    );
    expect(narrowed.positions.map(({ position }) => position.isin)).toEqual([sooner.isin]);
    expect(narrowed.purchases).toHaveLength(1);
    expect(activeFilterCount).toBe(2);
  });

  it('drops a saved bond or currency the wallet no longer has, so nothing is hidden', () => {
    const { filters, narrowed, activeFilterCount } = fitReportFilters(
      'yearOverYear',
      { currency: 'EUR', isins: ['UA4000000099'] },
      wallet,
    );
    expect(filters).toEqual({ currency: null, isins: [] });
    expect(narrowed.positions).toHaveLength(2);
    expect(activeFilterCount).toBe(0);
  });

  it('shows the bond nearest to maturity in the bond report at first, and the whole wallet', () => {
    const fitted = fitReportFilters('bond', initialState.bond, wallet);
    expect(fitted.filters.isin).toBe(sooner.isin);
    expect(fitted.filters.choices.map(({ position }) => position.isin)).toEqual([
      sooner.isin,
      later.isin,
    ]);
    expect(fitted.narrowed).toBe(wallet);
    expect(fitReportFilters('bond', { isin: later.isin }, wallet).activeFilterCount).toBe(1);
  });
});
