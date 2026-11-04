import type { OperationEvent, PositionPayment } from '@/lib/portfolio/portfolio';

import { groupScheduleEventsByMonth } from './scheduleSections';

it('groups events by month and totals only payments', () => {
  const payment: PositionPayment = {
    type: 'coupon',
    date: '2026-02-01',
    isin: 'UA1',
    currency: 'UAH',
    amount: 50,
    total: 100,
    quantity: 2,
    plannedQuantity: 0,
    isPaid: true,
  };
  const purchase: OperationEvent = {
    type: 'purchase',
    date: '2026-02-02',
    isin: 'UA1',
    currency: 'UAH',
    id: 'p',
    quantity: 1,
    total: 1000,
    isTopUp: false,
    planned: false,
  };
  const sections = groupScheduleEventsByMonth([
    payment,
    purchase,
    { ...purchase, id: 'q', date: '2026-03-02' },
  ]);
  expect(sections.map(({ key, data }) => [key, data.length])).toEqual([
    ['2026-02', 2],
    ['2026-03', 1],
  ]);
  expect(sections[0].paymentTotal).toContain('100,00');
  expect(sections[1].paymentTotal).toBe('');
});
