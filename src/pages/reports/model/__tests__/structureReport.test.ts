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

  it('splits bonds at maturity boundaries and weights their coupon rates by cost', () => {
    const dates = ['2026-09-01', '2026-09-02', '2027-03-02', '2028-03-02', '2029-03-02'];
    const bonds = dates.map((maturityDate, index) => ({
      ...bond,
      isin: `UA000000000${index}`,
      maturityDate,
      rate: index === 0 ? 20 : 10,
    }));
    const purchases = bonds.map((item, index) => ({
      ...plannedWallet.purchases[0],
      id: String(index),
      isin: item.isin,
      amount: index === 0 ? 4000 : 1000,
    }));
    const wallet = buildWallet(purchases, new Map(bonds.map((item) => [item.isin, item])), '2026-03-01');
    const [report] = structureReport(wallet, 'all').currencies;
    expect(report.terms.map(({ count }) => count)).toEqual([1, 1, 1, 1, 1]);
    expect(report.averageRate).toBe(15);
    expect(report.bonds[0].share).toBe(50);
  });
});
