import type { Bond, Operation } from '@/lib/portfolio/portfolio';
import { buildWallet } from '@/lib/portfolio/wallet';

import { cashFlowReport } from './cashFlowReport';

const bond: Bond = {
  isin: 'UA4000000001',
  currency: 'UAH',
  nominal: 1000,
  rate: 10,
  issueDate: '2024-01-01',
  maturityDate: '2027-01-01',
  description: '',
  payments: [
    { date: '2026-01-01', type: 'coupon', amount: 100 },
    { date: '2027-01-01', type: 'redemption', amount: 1000 },
  ],
};
const purchase: Operation = {
  id: 'purchase',
  type: 'purchase',
  ovdp: bond,
  isin: bond.isin,
  currency: 'UAH',
  date: '2025-01-01',
  quantity: 2,
  amount: 1800,
  planned: false,
};

it('allocates purchase cost to a sale and the remaining redemption', () => {
  const sale: Operation = {
    ...purchase,
    id: 'sale',
    type: 'sale',
    date: '2025-06-01',
    quantity: 1,
    amount: 950,
  };
  const wallet = buildWallet([purchase, sale], new Map(), '2026-02-01');
  expect(cashFlowReport(wallet, '2025-01-01', '2025-12-31')[0]).toMatchObject({
    purchases: 1800,
    sales: 950,
    income: 50,
  });
  expect(cashFlowReport(wallet, '2026-01-01', '2027-12-31')[0]).toMatchObject({
    coupons: 100,
    redemptions: 1000,
    income: 200,
  });
});

it('does not treat overdue unconfirmed operations or payments as received', () => {
  const planned = { ...purchase, planned: true };
  const wallet = buildWallet([planned], new Map(), '2026-02-01');
  expect(cashFlowReport(wallet, '2025-01-01', '2026-12-31')[0]).toMatchObject({
    plannedPurchases: 1800,
    coupons: 200,
    received: 0,
    expected: 200,
  });
});
