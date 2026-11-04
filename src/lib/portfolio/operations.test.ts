import { migratePurchases, withPlannedFlags } from './migrateOperations';
import { mergeBond, operationHistoryError, refreshOperationBonds } from './operations';
import type { Bond, PlanOperation } from './portfolio';
import { buildWallet } from './wallet';

const bond: Bond = {
  isin: 'UA1',
  nominal: 1000,
  rate: 10,
  currency: 'UAH',
  issueDate: '2025-01-01',
  maturityDate: '2027-01-01',
  description: '',
  payments: [
    { date: '2025-07-01', type: 'coupon', amount: 50 },
    { date: '2026-01-01', type: 'coupon', amount: 50 },
    { date: '2027-01-01', type: 'redemption', amount: 1000 },
  ],
};
const purchase: PlanOperation = {
  id: 'buy',
  planId: 'a',
  type: 'purchase',
  ovdp: bond,
  planned: false,
  isin: bond.isin,
  currency: 'UAH',
  date: '2025-02-01',
  quantity: 10,
  amount: 10000,
};
const sale: PlanOperation = {
  ...purchase,
  id: 'sell',
  type: 'sale',
  date: '2025-07-01',
  quantity: 4,
  amount: 4200,
};

it('keeps ten years of history without any catalog, including a partial sale on a coupon day', () => {
  const wallet = buildWallet([purchase, sale], new Map(), '2035-02-01');
  expect(wallet.positions[0].position.quantity).toBe(6);
  expect(wallet.payments.map(({ total }) => total)).toEqual([500, 300, 6000]);
  expect(wallet.positions[0].results).toMatchObject({
    invested: 10000,
    saleProceeds: 4200,
    totalPayments: 11000,
    netIncome: 1000,
    received: 11000,
  });
  expect(wallet.operationEvents.map(({ type }) => type)).toEqual(['purchase', 'sale']);
});

it('keeps closed positions and calculates their realized result without a published redemption', () => {
  const incomplete = { ...bond, payments: bond.payments.slice(0, 1) };
  const wallet = buildWallet(
    [
      { ...purchase, ovdp: incomplete },
      { ...sale, ovdp: incomplete, quantity: 10, amount: 10500 },
    ],
    new Map(),
    '2025-08-01',
  );
  expect(wallet.positions[0]).toMatchObject({
    state: 'sold',
    results: { complete: true, netIncome: 1000, saleProceeds: 10500 },
  });
  expect(wallet.positions[0].annualYield).not.toBeNull();
});

it('does not erase snapshots when the server omits a bond or its old payments', () => {
  expect(refreshOperationBonds([purchase], [], '2026-01-01')[0].ovdp).toEqual(bond);
  const fetched = {
    ...bond,
    payments: [{ date: '2027-01-01', type: 'redemption' as const, amount: 1001 }],
  };
  const refreshed = refreshOperationBonds(
    [purchase, sale, { ...purchase, id: 'other-plan', planId: 'b' }],
    [fetched],
    '2026-01-01',
  );
  expect(refreshed[0].ovdp?.payments).toHaveLength(3);
  expect(refreshed.every((operation) => operation.ovdp === refreshed[0].ovdp)).toBe(true);
  expect(refreshed[0].ovdp?.payments.at(-1)?.amount).toBe(1001);
});

it('keeps past payment amounts while accepting future corrections and missing historical rows', () => {
  const fetched = {
    ...bond,
    payments: bond.payments.map((payment) => ({ ...payment, amount: 123 })),
  };
  expect(mergeBond(bond, fetched, '2025-08-01').payments.map(({ amount }) => amount)).toEqual([
    50, 123, 123,
  ]);
});

it('rejects overselling on any date, after deleting or moving a purchase, and across plans', () => {
  expect(operationHistoryError([purchase, sale])).toBeUndefined();
  expect(operationHistoryError([sale])).toBeDefined();
  expect(operationHistoryError([{ ...purchase, date: '2025-08-01' }, sale])).toBeDefined();
  expect(operationHistoryError([purchase, { ...sale, quantity: 11 }])).toBeDefined();
  expect(operationHistoryError([purchase, { ...sale, planId: 'b' }])).toBeDefined();
});

it('migrates legacy purchases from the cache and preserves missing bonds explicitly', () => {
  const { type: _type, ovdp: _ovdp, date, planned: _planned, ...legacy } = purchase;
  const old = { ...legacy, purchaseDate: date };
  expect(migratePurchases([old], [bond], '2026-01-01')).toEqual([purchase]);
  expect(migratePurchases([old], [], '2026-01-01')[0]).toMatchObject({
    type: 'purchase',
    ovdp: null,
    date,
  });
  // A purchase still ahead when migrated stays planned.
  expect(migratePurchases([old], [bond], '2025-01-01')[0].planned).toBe(true);
});

it('gives operations saved before confirmation existed a planned flag by their date', () => {
  const { planned: _planned, ...unflagged } = purchase;
  const ahead = { ...unflagged, id: 'ahead', date: '2026-06-01' };
  expect(withPlannedFlags([unflagged, ahead], '2026-01-01').map((item) => item.planned)).toEqual([
    false,
    true,
  ]);
  // One dated ahead cannot have taken place, whatever it says; a confirmed one stays confirmed.
  expect(withPlannedFlags([{ ...ahead, planned: false }], '2026-01-01')[0].planned).toBe(true);
  expect(withPlannedFlags([{ ...unflagged, planned: true }], '2026-01-01')[0].planned).toBe(true);
});

it('allocates partial sales to the earliest purchases for annual yield', () => {
  const second = { ...purchase, id: 'second', date: '2025-03-01', amount: 9000 };
  const partial = { ...sale, quantity: 15, amount: 15000 };
  const wallet = buildWallet([second, partial, purchase], new Map(), '2025-08-01');
  expect(wallet.positions[0].position.quantity).toBe(5);
  expect(wallet.payments.map(({ quantity }) => quantity)).toEqual([20, 5, 5]);
  expect(wallet.positions[0].annualYield).not.toBeNull();
});
