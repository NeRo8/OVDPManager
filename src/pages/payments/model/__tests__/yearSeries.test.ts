import { yearSeries } from '../../ui/yearSeries';
import { yearSummary } from '../yearSummary';

it('shows planned purchases separately and respects selected event types', () => {
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
