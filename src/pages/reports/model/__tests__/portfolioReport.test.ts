import { buildWallet } from '@/entities/portfolio';

import { periodReport } from '../periodReport';
import { portfolioReport } from '../portfolioReport';

import { plannedWallet } from './plannedWallet';

describe('portfolioReport', () => {
  it('tells what of the money in a bond is still planned', () => {
    const [report] = portfolioReport(plannedWallet, 'all');
    expect(report.planned).toBe(2950);
    expect(report.bonds[0]).toMatchObject({ invested: 4950, planned: 2950 });
  });

  it('computes shares from the same known bonds as the total', () => {
    const unknown = {
      ...plannedWallet.purchases[0],
      id: 'unknown',
      isin: 'UA000UNKNOWN',
      amount: 5000,
    };
    const wallet = buildWallet(
      [...plannedWallet.purchases, unknown],
      plannedWallet.byIsin,
      plannedWallet.today,
    );
    const [report] = portfolioReport(wallet, 'all');
    expect(report.total?.invested).toBe(4950);
    expect(report.bonds.map(({ investedShare }) => investedShare)).toEqual([100, null]);
    const [period] = periodReport(wallet, '2025-01-01', '2025-12-31');
    expect(period.bonds.find(({ isin }) => isin === unknown.isin)?.hasBondData).toBe(false);
  });
});
