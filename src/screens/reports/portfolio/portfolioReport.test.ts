import type { Bond, Operation } from '@/lib/portfolio/portfolio';
import { buildWallet } from '@/lib/portfolio/wallet';

import { portfolioReport } from './portfolioReport';

const bond: Bond = {
  isin: 'UA4000000001',
  currency: 'UAH',
  nominal: 1000,
  rate: 10,
  issueDate: '2024-01-01',
  maturityDate: '2027-01-01',
  description: '',
  payments: [{ date: '2027-01-01', type: 'redemption', amount: 1000 }],
};

const purchase: Operation = {
  id: 'purchase',
  type: 'purchase',
  ovdp: bond,
  isin: bond.isin,
  currency: 'UAH',
  date: '2025-01-01',
  amount: 2000,
  quantity: 2,
  planned: false,
};

describe('portfolioReport', () => {
  it('includes sale proceeds and keeps fully sold positions out of the in-circulation filter', () => {
    const sale: Operation = {
      ...purchase,
      id: 'sale',
      type: 'sale',
      date: '2025-06-01',
      amount: 2100,
    };
    const wallet = buildWallet([purchase, sale], new Map(), '2026-01-01');
    const [report] = portfolioReport(wallet, 'all');

    expect(report.bonds[0].state).toBe('sold');
    expect(report.total).toMatchObject({ invested: 2000, saleProceeds: 2100, netIncome: 100 });
    expect(portfolioReport(wallet, 'inCirculation')).toEqual([]);
    expect(portfolioReport(wallet, 'redeemed')).toEqual([]);
  });

  it('counts an unconfirmed purchase as planned even after its date', () => {
    const planned: Operation = {
      ...purchase,
      id: 'planned',
      amount: 900,
      quantity: 1,
      planned: true,
    };
    const wallet = buildWallet([purchase, planned], new Map(), '2026-01-01');
    const [report] = portfolioReport(wallet, 'all');

    expect(report.planned).toBe(900);
    expect(report.bonds[0]).toMatchObject({ invested: 2900, planned: 900 });
  });

  it('includes the cost and planned amount of bonds without data in the currency totals', () => {
    const unknown: Operation = {
      ...purchase,
      id: 'unknown',
      isin: 'UA4000000099',
      ovdp: null,
      amount: 1000,
      quantity: 1,
      planned: true,
    };
    const wallet = buildWallet([purchase, unknown], new Map(), '2026-01-01');
    const [report] = portfolioReport(wallet, 'all');

    expect(report.total).toMatchObject({ invested: 3000, withoutDataCount: 1 });
    expect(report.planned).toBe(1000);
    expect(report.bonds.map((item) => item.investedShare)).toEqual([66.67, 33.33]);
    expect(report.unknownCount).toBe(1);
  });
});
