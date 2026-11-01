import { buildWallet } from '@/entities/portfolio';

import { periodReport } from '../periodReport';
import { portfolioReport } from '../portfolioReport';

import { bond, plannedWallet } from './plannedWallet';

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

  it('filters by status, orders by maturity and counts missing NBU data', () => {
    const redeemed = { ...bond, isin: 'UA000REDEEMED', maturityDate: '2025-12-01' };
    const missing = { ...plannedWallet.purchases[0], id: 'missing', isin: 'UA000UNKNOWN' };
    const old = { ...plannedWallet.purchases[0], id: 'old', isin: redeemed.isin };
    const wallet = buildWallet(
      [missing, ...plannedWallet.purchases, old],
      new Map([[bond.isin, bond], [redeemed.isin, redeemed]]),
      plannedWallet.today,
    );
    const [all] = portfolioReport(wallet, 'all');
    expect(all.bonds.map(({ isin }) => isin)).toEqual([redeemed.isin, bond.isin, missing.isin]);
    expect(all.unknownCount).toBe(1);
    expect(portfolioReport(wallet, 'redeemed')[0].bonds.map(({ isin }) => isin)).toEqual([
      redeemed.isin,
    ]);
    expect(portfolioReport(wallet, 'inCirculation')[0].bonds.map(({ isin }) => isin)).toEqual([
      bond.isin,
      missing.isin,
    ]);
  });
});
