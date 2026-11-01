import { buildWallet } from '@/entities/portfolio';

import { structureReport } from '../structureReport';

import { bond, plannedWallet } from './plannedWallet';

describe('structureReport', () => {
  it('counts the planned money only when planned purchases are let in', () => {
    expect(structureReport(plannedWallet, 'all').currencies[0]).toMatchObject({
      total: 4950,
      planned: 2950,
    });
    expect(structureReport(plannedWallet, 'made').currencies[0]).toMatchObject({
      total: 2000,
      planned: 0,
    });
  });

  it('calculates shares and averages before rounding a small total to cents', () => {
    const purchase = { ...plannedWallet.purchases[0], amount: 0.001, quantity: 1 };
    const wallet = buildWallet([purchase], new Map([[bond.isin, bond]]), plannedWallet.today);
    const [report] = structureReport(wallet, 'all').currencies;

    expect(report.total).toBe(0);
    expect(report.averageRate).toBe(bond.rate);
    expect(report.bonds[0].share).toBe(100);
    expect(report.terms.find(({ count }) => count > 0)?.share).toBe(100);
  });
});
