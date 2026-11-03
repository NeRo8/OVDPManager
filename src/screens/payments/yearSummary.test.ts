import type { PurchaseEvent } from '@/lib/portfolio/portfolio';

import { yearSummary } from './yearSummary';

function purchase(date: string): PurchaseEvent {
  return {
    type: 'purchase',
    date,
    currency: 'UAH',
    isin: 'UA1',
    quantity: 1,
    id: date,
    total: 100,
    isTopUp: false,
  };
}

describe('yearSummary', () => {
  it('selects the next purchase or the last past event', () => {
    const events = [purchase('2026-02-01'), purchase('2026-09-01'), purchase('2026-12-01')];
    expect(yearSummary(events, 'UAH', '2026-03-01').defaultMonth).toBe(8);
    expect(yearSummary(events, 'UAH', '2027-01-01').defaultMonth).toBe(11);
  });

  it('separates made and planned purchases by month', () => {
    const summary = yearSummary(
      [purchase('2026-02-01'), purchase('2026-09-01')],
      'UAH',
      '2026-03-01',
    );
    expect(summary).toMatchObject({ invested: 200, planned: 100, purchaseCount: 2 });
    expect(summary.monthlyPurchases[1]).toBe(100);
    expect(summary.monthlyPlannedPurchases[8]).toBe(100);
  });
});
