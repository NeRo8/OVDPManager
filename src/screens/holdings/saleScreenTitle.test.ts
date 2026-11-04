import type { Operation } from '@/lib/portfolio/portfolio';

import { saleScreenTitle } from './saleScreenTitle';

const today = '2026-10-31';
const saleOf = (id: string, date: string, planned: boolean): Operation => ({
  type: 'sale',
  ovdp: null,
  planned,
  id,
  isin: 'UA1',
  date,
  amount: 1000,
  quantity: 1,
  currency: 'UAH',
});

describe('saleScreenTitle', () => {
  it('asks to confirm only a planned sale whose date has come', () => {
    const operations = [
      saleOf('waiting', '2026-10-01', true),
      saleOf('ahead', '2026-12-01', true),
      saleOf('made', '2026-09-01', false),
    ];
    expect(saleScreenTitle(operations, 'waiting', today)).toBe('Підтвердити продаж');
    expect(saleScreenTitle(operations, 'ahead', today)).toBe('Продаж');
    expect(saleScreenTitle(operations, 'made', today)).toBe('Продаж');
    expect(saleScreenTitle(operations, undefined, today)).toBe('Продаж');
  });
});
