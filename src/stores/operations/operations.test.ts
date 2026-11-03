import type { PlanOperation } from '@/lib/portfolio/portfolio';
import {
  addOperation,
  copyPlanOperations,
  getOperations,
  removePlanOperations,
  removePosition,
  removeOperation,
  replaceOperations,
  updateOperation,
} from '@/stores/operations';

const purchaseOf = (planId: string, isin: string): Omit<PlanOperation, 'id'> => ({
  type: 'purchase',
  ovdp: null,
  planId,
  isin,
  date: '2026-01-15',
  amount: 1000,
  quantity: 1,
  currency: 'UAH',
});

const summary = () => getOperations().map(({ planId, isin }) => `${planId} ${isin}`);

beforeEach(() => replaceOperations([]));

describe('operations', () => {
  it('adds each purchase under an id of its own', () => {
    const first = addOperation(purchaseOf('a', 'UA1'));
    const second = addOperation(purchaseOf('a', 'UA1'));
    expect(first.id).not.toBe(second.id);
    expect(getOperations()).toEqual([first, second]);
  });

  it('changes only the date, quantity and amount of the purchase named', () => {
    const changed = addOperation(purchaseOf('a', 'UA1'));
    const other = addOperation(purchaseOf('a', 'UA1'));
    updateOperation(changed.id, { date: '2026-02-01', quantity: 3, amount: 2970 });
    expect(getOperations()).toEqual([
      { ...changed, date: '2026-02-01', quantity: 3, amount: 2970 },
      other,
    ]);
  });

  it('removes one purchase, every purchase of a bond in a plan, or a whole plan’s', () => {
    const removed = addOperation(purchaseOf('a', 'UA1'));
    addOperation(purchaseOf('a', 'UA1'));
    addOperation(purchaseOf('a', 'UA2'));
    addOperation(purchaseOf('b', 'UA1'));

    removeOperation(removed.id);
    expect(summary()).toEqual(['a UA1', 'a UA2', 'b UA1']);
    // The same bond in another plan stays.
    removePosition('a', 'UA1');
    expect(summary()).toEqual(['a UA2', 'b UA1']);
    removePlanOperations('a');
    expect(summary()).toEqual(['b UA1']);
  });

  it('copies a plan’s operations into another under new ids, the source untouched', () => {
    const source = addOperation(purchaseOf('a', 'UA1'));
    addOperation(purchaseOf('b', 'UA2'));
    copyPlanOperations('a', 'c');
    const copy = getOperations().find((purchase) => purchase.planId === 'c');
    expect(summary()).toEqual(['a UA1', 'b UA2', 'c UA1']);
    expect(copy).toEqual({ ...source, id: copy?.id, planId: 'c' });
    expect(copy?.id).not.toBe(source.id);
  });
});

it('does not change stored history when editing or deleting a purchase would invalidate a sale', () => {
  const bought = addOperation({ ...purchaseOf('a', 'UA1'), quantity: 10, amount: 10000 });
  addOperation({
    ...purchaseOf('a', 'UA1'),
    type: 'sale',
    date: '2026-02-01',
    quantity: 4,
    amount: 4100,
  });
  const before = getOperations();
  expect(() => removeOperation(bought.id)).toThrow('перевищує');
  expect(() =>
    updateOperation(bought.id, { date: '2026-03-01', quantity: 10, amount: 10000 }),
  ).toThrow('перевищує');
  expect(getOperations()).toEqual(before);
});
