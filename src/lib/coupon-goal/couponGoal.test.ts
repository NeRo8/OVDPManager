import type { CouponGoal } from '@/lib/portfolio/plan';
import type { Bond, Operation } from '@/lib/portfolio/portfolio';
import { buildWallet } from '@/lib/portfolio/wallet';

import { planCouponGoal } from './couponGoal';

const bond: Bond = {
  isin: 'UA1',
  kind: 'ovdp',
  nominal: 1000,
  rate: 10,
  currency: 'UAH',
  issueDate: '2025-10-01',
  maturityDate: '2028-03-01',
  description: '',
  payments: [
    { date: '2027-03-01', type: 'coupon', amount: 50 },
    { date: '2027-09-01', type: 'coupon', amount: 50 },
    { date: '2028-03-01', type: 'redemption', amount: 1000 },
  ],
};
const goal: CouponGoal = {
  currency: 'UAH',
  kind: 'ovdp',
  year: 2027,
  incomeYears: 1,
  purchaseYears: 1,
  monthly: 100,
  reinvest: false,
};
const today = '2026-01-01';

it('plans purchases in whole bonds and marks uncovered months', () => {
  const wallet = buildWallet([], new Map(), today);
  const result = planCouponGoal(wallet, [bond], goal, null);
  expect(result.complete).toBe(true);
  expect(result.bonds[0].quantity).toBe(2);
  expect(result.shortMonths).toHaveLength(10);
  expect(
    result.purchases.every(
      (operation) => operation.type === 'purchase' && operation.planned && operation.goalGenerated,
    ),
  ).toBe(true);
});

it('does not select a different bond kind or a bond that matures during purchases', () => {
  const wallet = buildWallet([], new Map(), today);
  const external = { ...bond, kind: 'ozdp' as const };
  expect(planCouponGoal(wallet, [external], goal, null).bonds).toEqual([]);
  expect(
    planCouponGoal(wallet, [{ ...bond, maturityDate: '2026-12-31' }], goal, null).bonds,
  ).toEqual([]);
});

it('accounts for an existing planned purchase before buying for the goal', () => {
  const operation: Operation = {
    id: 'p',
    type: 'purchase',
    ovdp: bond,
    isin: bond.isin,
    date: '2026-03-01',
    quantity: 1,
    amount: 1000,
    currency: 'UAH',
    planned: true,
  };
  const wallet = buildWallet([operation], new Map([[bond.isin, bond]]), today);
  expect(planCouponGoal(wallet, [bond], goal, null).plannedCost).toBe(1000);
});

it('reinvests coupons, proceeds of a sale and the remaining redemption without mixing currencies', () => {
  const held: Bond = {
    ...bond,
    isin: 'UA2',
    issueDate: '2025-01-01',
    maturityDate: '2026-09-01',
    payments: [
      { date: '2026-02-15', type: 'coupon', amount: 100 },
      { date: '2026-09-01', type: 'redemption', amount: 1000 },
    ],
  };
  const bought: Operation = {
    id: 'buy',
    type: 'purchase',
    ovdp: held,
    isin: held.isin,
    date: '2025-06-01',
    quantity: 2,
    amount: 2000,
    currency: 'UAH',
    planned: false,
  };
  const sold: Operation = {
    ...bought,
    id: 'sell',
    type: 'sale',
    date: '2026-02-20',
    quantity: 1,
    amount: 1100,
    planned: true,
  };
  const usdBond: Bond = { ...held, isin: 'USD1', currency: 'USD' };
  const usdPurchase: Operation = {
    ...bought,
    id: 'usd',
    isin: usdBond.isin,
    ovdp: usdBond,
    currency: 'USD',
  };
  const wallet = buildWallet(
    [bought, sold, usdPurchase],
    new Map([
      [held.isin, held],
      [usdBond.isin, usdBond],
    ]),
    today,
  );
  const reinvested = planCouponGoal(wallet, [bond], { ...goal, reinvest: true }, null);
  const withdrawn = planCouponGoal(wallet, [bond], { ...goal, reinvest: false }, null);

  expect(reinvested.planMoney).toBe(200 + 1100 + 1000);
  expect(withdrawn.planMoney).toBe(reinvested.planMoney);
  expect(reinvested.monthlyTopUp).toBeLessThan(withdrawn.monthlyTopUp);
  expect(reinvested.complete).toBe(true);
  expect(reinvested.cost + reinvested.plannedCost).toBeCloseTo(
    reinvested.planMoney +
      reinvested.goalMoney +
      reinvested.monthlyTopUp * reinvested.topUpMonths -
      reinvested.leftover,
    2,
  );
  expect(withdrawn.cost + withdrawn.plannedCost).toBeCloseTo(
    withdrawn.monthlyTopUp * withdrawn.topUpMonths - withdrawn.leftover,
    2,
  );
  expect(
    reinvested.purchases.every(({ date }) => date.endsWith('-01') || date === reinvested.to),
  ).toBe(true);
});

it('does not use a late redemption to pay for an earlier planned purchase', () => {
  const held: Bond = {
    ...bond,
    isin: 'UA2',
    issueDate: '2025-01-01',
    maturityDate: '2026-12-31',
    payments: [{ date: '2026-12-31', type: 'redemption', amount: 10000 }],
  };
  const bought: Operation = {
    id: 'held',
    type: 'purchase',
    ovdp: held,
    isin: held.isin,
    date: '2025-06-01',
    quantity: 1,
    amount: 10000,
    currency: 'UAH',
    planned: false,
  };
  const future: Operation = {
    id: 'planned',
    type: 'purchase',
    ovdp: bond,
    isin: bond.isin,
    date: '2026-03-15',
    quantity: 1,
    amount: 500,
    currency: 'UAH',
    planned: true,
  };
  const wallet = buildWallet(
    [bought, future],
    new Map([
      [held.isin, held],
      [bond.isin, bond],
    ]),
    today,
  );
  const result = planCouponGoal(wallet, [bond], { ...goal, reinvest: true }, null);
  expect(result.planMoney).toBe(10000);
  expect(result.plannedCost).toBe(500);
  expect(result.monthlyTopUp).toBe(167);
  expect(result.complete).toBe(true);
});

it('leaves a coupon on the purchase date with the previous owner', () => {
  const operation: Operation = {
    id: 'p',
    type: 'purchase',
    ovdp: bond,
    isin: bond.isin,
    date: '2027-03-01',
    quantity: 1,
    amount: 1000,
    currency: 'UAH',
    planned: true,
  };
  const wallet = buildWallet([operation], new Map([[bond.isin, bond]]), today);
  const result = planCouponGoal(wallet, [bond], goal, null);
  expect(result.months[2].plan).toBe(0);
  expect(result.months[8].plan).toBe(50);
});

it('calculates each year separately and reports missing coupon months', () => {
  const long: Bond = {
    ...bond,
    maturityDate: '2030-03-01',
    payments: [
      { date: '2027-03-01', type: 'coupon', amount: 50 },
      { date: '2027-09-01', type: 'coupon', amount: 50 },
      { date: '2028-03-01', type: 'coupon', amount: 50 },
      { date: '2028-09-01', type: 'coupon', amount: 50 },
      { date: '2030-03-01', type: 'redemption', amount: 1000 },
    ],
  };
  const result = planCouponGoal(
    buildWallet([], new Map(), today),
    [long],
    { ...goal, incomeYears: 2 },
    null,
  );
  expect(result.months).toHaveLength(24);
  expect([2, 8, 14, 20].map((index) => result.months[index].added)).toEqual([100, 100, 100, 100]);
  expect(result.shortMonths).toHaveLength(20);
});

it('does not recommend purchases when the existing portfolio already covers every month', () => {
  const monthly: Bond = {
    ...bond,
    payments: [
      ...Array.from({ length: 12 }, (_, index) => ({
        date: `2027-${String(index + 1).padStart(2, '0')}-15`,
        type: 'coupon' as const,
        amount: 50,
      })),
      { date: bond.maturityDate, type: 'redemption', amount: 1000 },
    ],
  };
  const operation: Operation = {
    id: 'held',
    type: 'purchase',
    ovdp: monthly,
    isin: monthly.isin,
    date: '2025-12-01',
    quantity: 2,
    amount: 2000,
    currency: 'UAH',
    planned: false,
  };
  const wallet = buildWallet([operation], new Map([[monthly.isin, monthly]]), today);
  const result = planCouponGoal(wallet, [], goal, null);
  expect(result.months.every((month) => month.plan === 100 && month.added === 0)).toBe(true);
  expect(result.purchases).toEqual([]);
  expect(result.shortMonths).toEqual([]);
});

it('shows all months uncovered when no eligible bonds exist', () => {
  const result = planCouponGoal(
    buildWallet([], new Map(), today),
    [bond],
    { ...goal, currency: 'EUR' },
    null,
  );
  expect(result.purchases).toEqual([]);
  expect(result.monthlyTopUp).toBe(0);
  expect(result.shortMonths).toEqual(Array.from({ length: 12 }, (_, index) => index));
});

it('places investments only in the selected years when there is a gap before coupons', () => {
  const laterBond: Bond = {
    ...bond,
    maturityDate: '2029-03-01',
    payments: [
      { date: '2028-03-01', type: 'coupon', amount: 50 },
      { date: '2028-09-01', type: 'coupon', amount: 50 },
      { date: '2029-03-01', type: 'redemption', amount: 1000 },
    ],
  };
  const result = planCouponGoal(
    buildWallet([], new Map(), today),
    [laterBond],
    { ...goal, year: 2028, purchaseEndYear: 2026 },
    null,
  );
  expect(result.complete).toBe(true);
  expect(result.from).toBe('2026-01-02');
  expect(result.to).toBe('2026-12-31');
  expect(result.purchases.length).toBeGreaterThan(0);
  expect(result.purchases.every(({ date }) => date >= result.from && date <= result.to)).toBe(true);
  expect(result.months[2].added).toBe(100);
  expect(result.months[8].added).toBe(100);
});
