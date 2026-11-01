import { buildWallet } from '@/entities/portfolio';

import { redemptionsReport } from '../redemptionsReport';

import { bond, plannedWallet } from './plannedWallet';

describe('redemptionsReport', () => {
  it('tells what of the redemptions ahead repays planned purchases', () => {
    const [report] = redemptionsReport(plannedWallet, 'upcoming');
    expect(report).toMatchObject({ total: 5000, expected: 5000, planned: 3000 });
  });

  it('filters past and upcoming redemptions and keeps empty years and their shares', () => {
    const amortizing = {
      ...bond,
      payments: [
        { date: '2025-08-01', type: 'redemption' as const, amount: 400 },
        { date: '2027-03-01', type: 'redemption' as const, amount: 600 },
      ],
    };
    const purchase = { ...plannedWallet.purchases[0], quantity: 1, amount: 1000 };
    const wallet = buildWallet([purchase], new Map([[bond.isin, amortizing]]), '2026-03-01');
    const [all] = redemptionsReport(wallet, 'all');
    expect(all).toMatchObject({ total: 1000, received: 400, expected: 600 });
    expect(all.years.map(({ year, total, share }) => [year, total, share])).toEqual([
      [2025, 400, 40],
      [2026, 0, 0],
      [2027, 600, 60],
    ]);
    expect(all.years[0].quarters).toEqual([{ quarter: 3, total: 400, share: 40 }]);
    expect(all.next?.date).toBe('2027-03-01');
    expect(all.last.date).toBe('2027-03-01');
    expect(redemptionsReport(wallet, 'past')[0].total).toBe(400);
    expect(redemptionsReport(wallet, 'upcoming')[0].total).toBe(600);
  });
});
