import { buildWallet } from '@/entities/portfolio';

import { yearOverYearReport } from '../yearOverYearReport';

import { bond, plannedWallet } from './plannedWallet';

describe('yearOverYearReport', () => {
  it('marks the years whose sums are partly a forecast', () => {
    const [report] = yearOverYearReport(plannedWallet);
    // 2025 is all past; 2026 has the planned purchase and a coupon ahead; 2027 is all ahead.
    expect(report.years.map(({ year, forecast }) => [year, forecast])).toEqual([
      [2025, false],
      [2026, true],
      [2027, true],
    ]);
  });

  it('does not express a change from positive income to a loss as a percentage', () => {
    const lossBond = {
      ...bond,
      maturityDate: '2026-09-01',
      payments: [
        { type: 'coupon' as const, date: '2025-09-01', amount: 50 },
        { type: 'redemption' as const, date: '2026-09-01', amount: 1000 },
      ],
    };
    const purchase = { ...plannedWallet.purchases[0], quantity: 1, amount: 1200 };
    const wallet = buildWallet([purchase], new Map([[bond.isin, lossBond]]), '2027-01-01');
    const [report] = yearOverYearReport(wallet);
    expect(report.years.find(({ year }) => year === 2025)?.income).toBe(50);
    expect(report.years.find(({ year }) => year === 2026)).toMatchObject({
      income: -200,
      incomeChange: null,
    });
  });

  it('makes total income equal the sum of rounded annual rows', () => {
    const amortizing = {
      ...bond,
      maturityDate: '2027-01-01',
      payments: [
        { type: 'redemption' as const, date: '2025-01-01', amount: 333.33 },
        { type: 'redemption' as const, date: '2026-01-01', amount: 333.33 },
        { type: 'redemption' as const, date: '2027-01-01', amount: 333.34 },
      ],
    };
    const purchases = [
      { ...plannedWallet.purchases[0], purchaseDate: '2024-10-01', quantity: 1, amount: 1000.01 },
    ];
    const wallet = buildWallet(purchases, new Map([[bond.isin, amortizing]]), '2027-02-01');
    const [report] = yearOverYearReport(wallet);
    expect(report.total.income).toBeCloseTo(
      report.years.reduce((sum, year) => sum + year.income, 0),
      2,
    );
  });

  it('includes empty years, calculates changes and picks the earliest year on a tie', () => {
    const sparseBond = {
      ...bond,
      maturityDate: '2029-03-01',
      payments: [
        { type: 'coupon' as const, date: '2026-03-01', amount: 100 },
        { type: 'coupon' as const, date: '2027-03-01', amount: 100 },
        { type: 'coupon' as const, date: '2029-03-01', amount: 50 },
        { type: 'redemption' as const, date: '2029-03-01', amount: 1000 },
      ],
    };
    const purchase = { ...plannedWallet.purchases[0], quantity: 1, amount: 1000 };
    const wallet = buildWallet([purchase], new Map([[bond.isin, sparseBond]]), '2030-01-01');
    const [report] = yearOverYearReport(wallet);

    expect(
      report.years.map(({ year, income, incomeChange }) => [year, income, incomeChange]),
    ).toEqual([
      [2025, 0, null],
      [2026, 100, null],
      [2027, 100, 0],
      [2028, 0, -100],
      [2029, 50, null],
    ]);
    expect(report.highlights.highestIncome?.year).toBe(2026);
    expect(report.highlights.highestPayments?.year).toBe(2029);
    expect(report.highlights.highestInvested?.year).toBe(2025);
  });

  it('does not pick highlights when there is only one year to compare', () => {
    const wallet = buildWallet([plannedWallet.purchases[0]], new Map(), '2026-03-01');
    const [report] = yearOverYearReport(wallet);
    expect(report.years).toHaveLength(1);
    expect(report.highlights).toEqual({
      highestIncome: undefined,
      highestPayments: undefined,
      highestInvested: undefined,
    });
  });

  it('calculates percentage growth when both years have positive income', () => {
    const growingBond = {
      ...bond,
      payments: [
        { type: 'coupon' as const, date: '2025-09-01', amount: 100 },
        { type: 'coupon' as const, date: '2026-09-01', amount: 150 },
        { type: 'redemption' as const, date: '2027-03-01', amount: 1000 },
      ],
    };
    const purchase = { ...plannedWallet.purchases[0], quantity: 1, amount: 1000 };
    const wallet = buildWallet([purchase], new Map([[bond.isin, growingBond]]), '2028-01-01');
    const [report] = yearOverYearReport(wallet);
    expect(report.years.find(({ year }) => year === 2026)?.incomeChange).toBe(50);
  });
});
