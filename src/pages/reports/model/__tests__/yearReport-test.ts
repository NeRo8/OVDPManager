import { type Bond, type Purchase, buildWallet } from '@/entities/portfolio';

import { yearReport } from '../yearReport';

const short: Bond = {
  isin: 'UA4000000001',
  currency: 'UAH',
  nominal: 1000,
  rate: 10,
  issueDate: '2024-01-01',
  maturityDate: '2025-12-01',
  description: 'ОВДП',
  payments: [
    { date: '2025-06-01', type: 'coupon', amount: 60 },
    { date: '2025-12-01', type: 'coupon', amount: 60 },
    { date: '2025-12-01', type: 'redemption', amount: 1000 },
  ],
};

const long: Bond = {
  ...short,
  isin: 'UA4000000002',
  maturityDate: '2026-12-01',
  payments: [
    { date: '2025-09-01', type: 'coupon', amount: 120 },
    { date: '2026-09-01', type: 'coupon', amount: 120 },
    { date: '2026-12-01', type: 'redemption', amount: 1000 },
  ],
};

function purchase(id: string, isin: string, purchaseDate: string, amount: number): Purchase {
  return { id, isin, purchaseDate, amount, quantity: 1, currency: 'UAH' };
}

describe('yearReport', () => {
  const wallet = buildWallet(
    [
      purchase('first', short.isin, '2025-01-10', 1000),
      purchase('second', long.isin, '2025-03-10', 3000),
    ],
    new Map([
      [short.isin, short],
      [long.isin, long],
    ]),
    '2026-02-01',
  );
  const [report] = yearReport(wallet, 2025);

  it('tells the planned purchases from those made', () => {
    expect(report.planned).toBe(0);
    const ahead = buildWallet(wallet.purchases, wallet.byIsin, '2025-02-01');
    const [planned] = yearReport(ahead, 2025);
    expect(planned.planned).toBe(3000);
    expect(planned.months.find(({ month }) => month === '2025-03')?.planned).toBe(3000);
    expect(planned.bonds.map((bond) => bond.planned)).toEqual([0, 3000]);
  });

  it('spreads the coupons over the twelve months, leaving the redemption out', () => {
    expect(report).toMatchObject({ invested: 4000, coupons: 240, redemptions: 1000 });
    expect(report.months).toHaveLength(12);
    expect(report.averageMonthlyCoupons).toBe(20);
  });

  it('averages the bonds’ annual yield by what they cost', () => {
    const [first, second] = report.bonds;
    if (first.annualYield === null || second.annualYield === null) throw new Error('no yield');
    const expected = (first.annualYield * 1000 + second.annualYield * 3000) / 4000;
    expect(report.annualYield).toBeCloseTo(expected, 1);
    expect(report.highlights.highestYield?.annualYield).toBe(
      Math.max(first.annualYield, second.annualYield),
    );
  });
});
