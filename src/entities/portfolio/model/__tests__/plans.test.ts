import { getActivePlan, setActivePlan } from '../activePlan';
import { uniquePlanName } from '../plan';
import {
  createInvestmentPlan,
  duplicateInvestmentPlan,
  getInvestmentPlans,
  removeInvestmentPlan,
  restorePortfolio,
} from '../plans';
import { addPurchase, getPurchases } from '../purchases';

beforeEach(() => restorePortfolio([], []));

it('chooses unique names within the length limit', () => {
  expect(uniquePlanName('План 2', [{ name: 'план 2' }])).toBe('План 2 (2)');
  expect(uniquePlanName('А'.repeat(80), [{ name: 'А'.repeat(80) }])).toHaveLength(80);
});

it('duplicates purchases without changing the active plan and uses distinct names', () => {
  const id = createInvestmentPlan('План');
  setActivePlan(id);
  addPurchase({
    planId: id,
    isin: 'UA1',
    currency: 'UAH',
    purchaseDate: '2026-01-01',
    amount: 1000,
    quantity: 1,
  });
  expect(duplicateInvestmentPlan(id)).toBe('План (копія)');
  expect(duplicateInvestmentPlan(id)).toBe('План (копія) (2)');
  expect(getActivePlan()?.id).toBe(id);
  expect(getPurchases()).toHaveLength(3);
  expect(new Set(getPurchases().map((purchase) => purchase.id)).size).toBe(3);
});

it('falls back to the first plan after deleting the active plan', () => {
  const first = createInvestmentPlan('Перший');
  const second = createInvestmentPlan('Другий');
  setActivePlan(second);
  removeInvestmentPlan(second);
  expect(getActivePlan()?.id).toBe(first);
  expect(getInvestmentPlans()).toHaveLength(1);
});

it('keeps exactly one active plan when switching plans', () => {
  const firstId = createInvestmentPlan('A');
  const secondId = createInvestmentPlan('B');
  expect(getInvestmentPlans().map((plan) => plan.isActive)).toEqual([true, false]);
  setActivePlan(secondId);
  expect(getActivePlan()?.id).toBe(secondId);
  expect(getInvestmentPlans().map((plan) => plan.isActive)).toEqual([false, true]);
  setActivePlan(firstId);
  expect(getInvestmentPlans().map((plan) => plan.isActive)).toEqual([true, false]);
});
