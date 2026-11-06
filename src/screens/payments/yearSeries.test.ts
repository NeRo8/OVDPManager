import { yearSeries } from './yearSeries';
import { yearSummary } from './yearSummary';

describe('yearSeries', () => {
  it('shows planned operations separately and respects selected event types', () => {
    const summary = yearSummary(
      [
        {
          type: 'purchase',
          id: 'p',
          isin: 'UA1',
          date: '2027-01-01',
          currency: 'UAH',
          quantity: 1,
          total: 1000,
          isTopUp: false,
          planned: true,
        },
      ],
      'UAH',
      '2026-12-01',
    );
    expect(yearSeries(summary, ['purchase']).map(({ color, total }) => [color, total])).toEqual([
      ['plannedPurchase', 1000],
    ]);
    expect(yearSeries(summary, ['coupon']).map(({ type }) => type)).toEqual(['coupon']);
  });
});

describe('sales in yearly chart series', () => {
  it('shows sales in the selected months and hides them when filtered out', () => {
    const summary = yearSummary(
      [
        {
          type: 'sale',
          id: 'sale',
          isin: 'UA1',
          date: '2026-04-01',
          currency: 'UAH',
          quantity: 1,
          total: 1200,
          isTopUp: false,
          planned: true,
        },
      ],
      'UAH',
      '2026-03-01',
    );
    const [series] = yearSeries(summary, ['sale']);
    expect(series).toMatchObject({ type: 'sale', total: 1200, color: 'sale' });
    expect(series.values[3]).toBe(1200);
    expect(yearSeries(summary, ['coupon']).some((item) => item.type === 'sale')).toBe(false);
  });
});
