import type { Bond, Operation } from '@/lib/portfolio/portfolio';
import { buildWallet } from '@/lib/portfolio/wallet';

import { convertFxEvents, fxEvents, fxRemainingCost, fxTrend } from './fxReport';

const bond: Bond = {
  isin: 'UA4000000001',
  currency: 'UAH',
  nominal: 1000,
  rate: 10,
  issueDate: '2024-01-01',
  maturityDate: '2027-01-01',
  description: '',
  payments: [{ type: 'coupon', date: '2025-07-01', amount: 100 }],
};
const purchase: Operation = {
  id: 'made',
  type: 'purchase',
  isin: bond.isin,
  currency: 'UAH',
  ovdp: bond,
  date: '2025-01-01',
  quantity: 1,
  amount: 1000,
  planned: false,
};

it('converts only confirmed operations and the received portion of payments', () => {
  const planned = { ...purchase, id: 'planned', quantity: 2, amount: 2000, planned: true };
  const wallet = buildWallet([purchase, planned], new Map(), '2025-08-01');
  const events = fxEvents(wallet);
  expect(events.map(({ type, amount }) => [type, amount])).toEqual([
    ['purchase', 1000],
    ['coupon', 100],
  ]);
  expect(
    convertFxEvents(events, { '2025-01-01': 40, '2025-07-01': 50 }).map(
      ({ equivalent }) => equivalent,
    ),
  ).toEqual([25, 2]);
});

it('values only confirmed remaining lots after partial redemption', () => {
  const partialBond: Bond = {
    ...bond,
    payments: [{ type: 'redemption', date: '2025-07-01', amount: 500 }],
  };
  const buy = { ...purchase, ovdp: partialBond, quantity: 2, amount: 1800 };
  const sale: Operation = {
    ...buy,
    id: 'sale',
    type: 'sale',
    date: '2025-08-01',
    quantity: 1,
    amount: 500,
  };
  const wallet = buildWallet([buy, sale], new Map(), '2025-09-01');
  expect(fxRemainingCost(wallet, '2025-09-01')).toBe(450);
});

it('uses historical exchange rates for each month-end valuation', () => {
  const wallet = buildWallet([purchase], new Map(), '2025-03-15');
  const rates = { '2025-01-01': 40, '2025-01-31': 40, '2025-02-28': 50, '2025-03-15': 50 };
  const points = fxTrend(
    wallet,
    convertFxEvents(fxEvents(wallet), rates),
    rates,
    '2025-03-15',
    'year',
  );
  expect(points.map(({ invested, value }) => [invested, value])).toEqual([
    [25, 25],
    [25, 20],
    [25, 20],
  ]);
});
