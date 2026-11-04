import type { Operation } from '@/lib/portfolio/portfolio';

import { hasMadePurchase, purchaseScreenTitle } from './purchaseScreenTitle';

const today = '2026-10-31';
const purchaseOf = (id: string, isin: string, date: string): Operation => ({
  type: 'purchase',
  ovdp: null,
  planned: false,
  id,
  isin,
  date,
  amount: 1000,
  quantity: 1,
  currency: 'UAH',
});

const made = purchaseOf('made', 'UA1', '2026-05-01');
const planned = { ...purchaseOf('planned', 'UA2', '2026-12-01'), planned: true };

describe('purchaseScreenTitle', () => {
  it('tops up a bond already bought, not one only planned', () => {
    expect(hasMadePurchase([made])).toBe(true);
    expect(hasMadePurchase([planned])).toBe(false);
    expect(purchaseScreenTitle([made, planned], 'UA1', undefined, today)).toBe('Докупити ОВДП');
    expect(purchaseScreenTitle([made, planned], 'UA2', undefined, today)).toBe('Додати купівлю');
    expect(purchaseScreenTitle([made, planned], 'UA3', undefined, today)).toBe('Додати купівлю');
  });

  it('asks to confirm a planned purchase whose date has come, and only counts it once confirmed', () => {
    const overdue = { ...purchaseOf('overdue', 'UA2', '2026-10-01'), planned: true };
    expect(purchaseScreenTitle([overdue], 'UA2', 'overdue', today)).toBe('Підтвердити купівлю');
    expect(purchaseScreenTitle([overdue], 'UA2', undefined, today)).toBe('Додати купівлю');
    expect(purchaseScreenTitle([planned], 'UA2', 'planned', today)).toBe('Змінити купівлю');
  });

  it('counts a purchase dated today as made', () => {
    const todays = purchaseOf('todays', 'UA2', today);
    expect(purchaseScreenTitle([todays], 'UA2', undefined, today)).toBe('Докупити ОВДП');
  });

  it('edits a purchase of the bond, and says when it is gone', () => {
    expect(purchaseScreenTitle([made], 'UA1', 'made', today)).toBe('Змінити купівлю');
    expect(purchaseScreenTitle([made], 'UA1', 'deleted', today)).toBe('Купівлі немає');
    // The id must belong to the bond in the address.
    expect(purchaseScreenTitle([made], 'UA2', 'made', today)).toBe('Купівлі немає');
    // A sale is no purchase to edit.
    const sold = { ...purchaseOf('sold', 'UA1', '2026-06-01'), type: 'sale' as const };
    expect(purchaseScreenTitle([made, sold], 'UA1', 'sold', today)).toBe('Купівлі немає');
  });
});
