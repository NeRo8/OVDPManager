import type { PlanPurchase } from '@/lib/portfolio/portfolio';
import {
  addPurchase,
  copyPlanPurchases,
  getPurchases,
  removePlanPurchases,
  removePosition,
  removePurchase,
  replacePurchases,
  updatePurchase,
} from '@/stores/purchases';

const purchaseOf = (planId: string, isin: string): Omit<PlanPurchase, 'id'> => ({
  planId,
  isin,
  purchaseDate: '2026-01-15',
  amount: 1000,
  quantity: 1,
  currency: 'UAH',
});

const summary = () => getPurchases().map(({ planId, isin }) => `${planId} ${isin}`);

beforeEach(() => replacePurchases([]));

describe('purchases', () => {
  it('adds each purchase under an id of its own', () => {
    const first = addPurchase(purchaseOf('a', 'UA1'));
    const second = addPurchase(purchaseOf('a', 'UA1'));
    expect(first.id).not.toBe(second.id);
    expect(getPurchases()).toEqual([first, second]);
  });

  it('changes only the date, quantity and amount of the purchase named', () => {
    const changed = addPurchase(purchaseOf('a', 'UA1'));
    const other = addPurchase(purchaseOf('a', 'UA1'));
    updatePurchase(changed.id, { purchaseDate: '2026-02-01', quantity: 3, amount: 2970 });
    expect(getPurchases()).toEqual([
      { ...changed, purchaseDate: '2026-02-01', quantity: 3, amount: 2970 },
      other,
    ]);
  });

  it('removes one purchase, every purchase of a bond in a plan, or a whole plan’s', () => {
    const removed = addPurchase(purchaseOf('a', 'UA1'));
    addPurchase(purchaseOf('a', 'UA1'));
    addPurchase(purchaseOf('a', 'UA2'));
    addPurchase(purchaseOf('b', 'UA1'));

    removePurchase(removed.id);
    expect(summary()).toEqual(['a UA1', 'a UA2', 'b UA1']);
    // The same bond in another plan stays.
    removePosition('a', 'UA1');
    expect(summary()).toEqual(['a UA2', 'b UA1']);
    removePlanPurchases('a');
    expect(summary()).toEqual(['b UA1']);
  });

  it('copies a plan’s purchases into another under new ids, the source untouched', () => {
    const source = addPurchase(purchaseOf('a', 'UA1'));
    addPurchase(purchaseOf('b', 'UA2'));
    copyPlanPurchases('a', 'c');
    const copy = getPurchases().find((purchase) => purchase.planId === 'c');
    expect(summary()).toEqual(['a UA1', 'b UA2', 'c UA1']);
    expect(copy).toEqual({ ...source, id: copy?.id, planId: 'c' });
    expect(copy?.id).not.toBe(source.id);
  });
});
