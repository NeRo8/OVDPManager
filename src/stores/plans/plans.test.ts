import { samePlanName, uniquePlanName } from '@/lib/portfolio/plan';
import type { PlanOperation } from '@/lib/portfolio/portfolio';
import { addOperation, getOperations } from '@/stores/operations';
import {
  getActivePlan,
  createInvestmentPlan,
  duplicateInvestmentPlan,
  getInvestmentPlans,
  removeInvestmentPlan,
  restorePortfolio,
  setActivePlan,
  addOperationToActivePlan,
  createActivePlan,
  getActiveOperations,
  removePositionFromActivePlan,
} from '@/stores/plans';

const purchase = {
  type: 'purchase',
  ovdp: null,
  planned: false,
  isin: 'UA1',
  date: '2026-01-15',
  amount: 1000,
  quantity: 1,
} as const;

const purchaseIn = (planId: string, isin = 'UA1'): PlanOperation => ({
  ...purchase,
  id: `${planId}-${isin}`,
  planId,
  isin,
  currency: 'UAH',
});

beforeEach(() => restorePortfolio([], []));

describe('the active plan', () => {
  it('is the plan marked active, else the first one, else none', () => {
    expect(getActivePlan()).toBeUndefined();
    restorePortfolio(
      [],
      [
        { id: 'a', name: 'A', isActive: false },
        { id: 'b', name: 'B', isActive: true },
      ],
    );
    expect(getActivePlan()?.id).toBe('b');
  });

  it('is a plan just created', () => {
    createActivePlan('Перший');
    createActivePlan('Другий');
    expect(getActivePlan()?.name).toBe('Другий');
    expect(getInvestmentPlans().filter((plan) => plan.isActive)).toHaveLength(1);
  });

  it('takes a new purchase, and with no plan nothing is added', () => {
    expect(addOperationToActivePlan({ ...purchase, currency: 'UAH' })).toBe(false);
    expect(getOperations()).toEqual([]);

    createActivePlan('План');
    expect(addOperationToActivePlan({ ...purchase, currency: 'UAH' })).toBe(true);
    expect(getOperations()).toEqual([
      expect.objectContaining({ ...purchase, planId: getActivePlan()?.id }),
    ]);
  });

  it('gives and removes only its own operations', () => {
    restorePortfolio(
      [purchaseIn('a'), purchaseIn('a', 'UA2'), purchaseIn('b')],
      [
        { id: 'a', name: 'A', isActive: true },
        { id: 'b', name: 'B', isActive: false },
      ],
    );
    expect(getActiveOperations().map(({ id }) => id)).toEqual(['a-UA1', 'a-UA2']);
    removePositionFromActivePlan('UA1');
    expect(getOperations().map(({ id }) => id)).toEqual(['a-UA2', 'b-UA1']);
  });
});

describe('plan store', () => {
  it('takes names that differ only in case or outer spaces for the same', () => {
    expect(samePlanName(' Мій План ', 'мій план')).toBe(true);
    expect(samePlanName('План 1', 'План 2')).toBe(false);
  });

  it('chooses unique names within the length limit', () => {
    expect(uniquePlanName('План 2', [{ name: 'план 2' }])).toBe('План 2 (2)');
    expect(uniquePlanName('А'.repeat(80), [{ name: 'А'.repeat(80) }])).toHaveLength(80);
  });

  it('duplicates operations without changing the active plan and uses distinct names', () => {
    const id = createInvestmentPlan('План');
    setActivePlan(id);
    addOperation({
      type: 'purchase',
      ovdp: null,
      planned: false,
      planId: id,
      isin: 'UA1',
      currency: 'UAH',
      date: '2026-01-01',
      amount: 1000,
      quantity: 1,
    });
    expect(duplicateInvestmentPlan(id)).toBe('План (копія)');
    expect(duplicateInvestmentPlan(id)).toBe('План (копія) (2)');
    expect(getActivePlan()?.id).toBe(id);
    expect(getOperations()).toHaveLength(3);
    expect(new Set(getOperations().map((purchase) => purchase.id)).size).toBe(3);
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
});
