import { createGoalPlan, getActivePlan, setActivePlan } from '../activePlan';
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

it('creates a goal copy and falls back after its deletion', () => {
  const id = createInvestmentPlan('План');
  setActivePlan(id);
  const goal = {
    currency: 'UAH' as const,
    year: 2028,
    incomeYears: 1,
    purchaseYears: 1,
    monthly: 1000,
    reinvest: false,
  };
  expect(
    createGoalPlan(goal, [
      { isin: 'UA1', currency: 'UAH', purchaseDate: '2027-01-01', amount: 1000, quantity: 1 },
    ]),
  ).toBe('План · ціль 2028');
  const copy = getActivePlan();
  expect(copy?.goal).toEqual(goal);
  expect(getPurchases().filter((purchase) => purchase.planId === copy?.id)).toHaveLength(1);
  removeInvestmentPlan(copy!.id);
  expect(getActivePlan()?.id).toBe(id);
  expect(getInvestmentPlans()).toHaveLength(1);
  expect(getPurchases()).toHaveLength(0);
});
