import { type PurchaseEvent } from '@/entities/portfolio';

import { yearSummary } from '../yearSummary';

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
});
