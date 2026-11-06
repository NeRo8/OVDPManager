import type { Bond, Operation } from '@/lib/portfolio/portfolio';
import { buildWallet } from '@/lib/portfolio/wallet';

import { redemptionsReport } from './redemptionsReport';

const bond: Bond = {
  isin: 'UA4000000001',
  currency: 'UAH',
  nominal: 1000,
  rate: 10,
  issueDate: '2024-01-01',
  maturityDate: '2025-12-01',
  description: '',
  payments: [{ date: '2025-12-01', type: 'redemption', amount: 1000 }],
};

const purchase: Operation = {
  id: 'confirmed',
  type: 'purchase',
  ovdp: bond,
  isin: bond.isin,
  currency: 'UAH',
  date: '2025-01-01',
  amount: 1900,
  quantity: 2,
  planned: false,
};

describe('redemptionsReport', () => {
  it('splits an overdue payment between confirmed and unconfirmed purchases', () => {
    const planned = { ...purchase, id: 'planned', quantity: 3, amount: 2800, planned: true };
    const wallet = buildWallet([purchase, planned], new Map(), '2026-01-01');

    expect(redemptionsReport(wallet, 'all')[0]).toMatchObject({
      total: 5000,
      received: 2000,
      expected: 3000,
      planned: 3000,
    });
    expect(redemptionsReport(wallet, 'past')[0]).toMatchObject({
      total: 2000,
      received: 2000,
      expected: 0,
      planned: 0,
    });
    expect(redemptionsReport(wallet, 'upcoming')[0]).toMatchObject({
      total: 3000,
      received: 0,
      expected: 3000,
      planned: 3000,
    });
  });

  it('counts a payment today as expected and excludes bonds sold before it', () => {
    const sale: Operation = {
      ...purchase,
      id: 'sale',
      type: 'sale',
      date: '2025-10-01',
      quantity: 1,
      amount: 1000,
    };
    const wallet = buildWallet([purchase, sale], new Map(), '2025-12-01');

    expect(redemptionsReport(wallet, 'past')).toEqual([]);
    expect(redemptionsReport(wallet, 'upcoming')[0]).toMatchObject({ total: 1000, expected: 1000 });
  });
});
