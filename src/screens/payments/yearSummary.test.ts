import type { OperationEvent } from '@/lib/portfolio/portfolio';

import { yearSummary } from './yearSummary';

function purchase(date: string, planned = false): OperationEvent {
  return {
    type: 'purchase',
    date,
    currency: 'UAH',
    isin: 'UA1',
    quantity: 1,
    id: date,
    total: 100,
    isTopUp: false,
    planned,
  };
}

describe('yearSummary', () => {
  it('selects the next purchase or the last past event', () => {
    const events = [purchase('2026-02-01'), purchase('2026-09-01'), purchase('2026-12-01')];
    expect(yearSummary(events, 'UAH', '2026-03-01').defaultMonth).toBe(8);
    expect(yearSummary(events, 'UAH', '2027-01-01').defaultMonth).toBe(11);
  });

  it('separates made and planned operations by month', () => {
    const summary = yearSummary(
      [purchase('2026-02-01'), purchase('2026-09-01', true)],
      'UAH',
      '2026-03-01',
    );
    expect(summary).toMatchObject({ invested: 200, planned: 100, purchaseCount: 2 });
    expect(summary.monthlyPurchases[1]).toBe(100);
    expect(summary.monthlyPlannedPurchases[8]).toBe(100);
  });
});

describe('sales in yearly totals', () => {
  it('includes planned sales in inflows but only confirmed sales in received amounts', () => {
    const confirmed = {
      ...purchase('2026-02-01'),
      id: 'sale-1',
      type: 'sale' as const,
      total: 900,
    };
    const planned = {
      ...purchase('2026-03-01', true),
      id: 'sale-2',
      type: 'sale' as const,
      total: 700,
    };
    const summary = yearSummary([confirmed, planned], 'UAH', '2026-04-01');
    expect(summary).toMatchObject({
      saleTotal: 1600,
      totalPayments: 1600,
      received: 900,
      invested: 0,
    });
    expect(summary.monthlySales.slice(1, 3)).toEqual([900, 700]);
  });
});
