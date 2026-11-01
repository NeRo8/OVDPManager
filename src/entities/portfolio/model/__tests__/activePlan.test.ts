import {
  addPurchaseToActivePlan,
  createActivePlan,
  getActivePlan,
  getActivePurchases,
  removePositionFromActivePlan,
} from '../activePlan';
import { getInvestmentPlans, restorePortfolio } from '../plans';
import type { PlanPurchase } from '../portfolio';
import { getPurchases } from '../purchases';

const purchase = { isin: 'UA1', purchaseDate: '2026-01-15', amount: 1000, quantity: 1 } as const;
const purchaseIn = (planId: string, isin = 'UA1'): PlanPurchase => ({
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
    expect(addPurchaseToActivePlan({ ...purchase, currency: 'UAH' })).toBe(false);
    expect(getPurchases()).toEqual([]);

    createActivePlan('План');
    expect(addPurchaseToActivePlan({ ...purchase, currency: 'UAH' })).toBe(true);
    expect(getPurchases()).toEqual([
      expect.objectContaining({ ...purchase, planId: getActivePlan()?.id }),
    ]);
  });

  it('gives and removes only its own purchases', () => {
    restorePortfolio(
      [purchaseIn('a'), purchaseIn('a', 'UA2'), purchaseIn('b')],
      [
        { id: 'a', name: 'A', isActive: true },
        { id: 'b', name: 'B', isActive: false },
      ],
    );
    expect(getActivePurchases().map(({ id }) => id)).toEqual(['a-UA1', 'a-UA2']);
    removePositionFromActivePlan('UA1');
    expect(getPurchases().map(({ id }) => id)).toEqual(['a-UA2', 'b-UA1']);
  });
});
