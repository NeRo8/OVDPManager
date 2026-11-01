import { buildWallet } from '@/entities/portfolio';

import { periodDates, walletSpan } from '../periodDates';

const purchase = {
  id: 'purchase',
  isin: 'UA4000000001',
  purchaseDate: '2024-12-15',
  quantity: 1,
  amount: 1000,
  currency: 'UAH' as const,
};
const wallet = buildWallet([purchase], new Map(), '2026-03-15');

describe('report periods', () => {
  it('uses whole calendar months and quarters', () => {
    expect(periodDates('month', wallet, null)).toEqual({ from: '2026-03-01', to: '2026-03-31' });
    expect(periodDates('lastMonth', wallet, null)).toEqual({
      from: '2026-02-01',
      to: '2026-02-28',
    });
    expect(periodDates('quarter', wallet, null)).toEqual({ from: '2026-01-01', to: '2026-03-31' });
    expect(periodDates('lastQuarter', wallet, null)).toEqual({
      from: '2025-10-01',
      to: '2025-12-31',
    });
  });

  it('ends year to date today and takes the twelve whole months before this one', () => {
    expect(periodDates('yearToDate', wallet, null)).toEqual({
      from: '2026-01-01',
      to: '2026-03-15',
    });
    expect(periodDates('last12Months', wallet, null)).toEqual({
      from: '2025-03-01',
      to: '2026-02-28',
    });
  });

  it('uses the wallet span and preserves a custom period', () => {
    expect(walletSpan(wallet)).toEqual({ from: '2024-12-15', to: '2024-12-15' });
    expect(periodDates('plan', wallet, null)).toEqual(walletSpan(wallet));
    expect(periodDates('custom', wallet, { from: '2023-01-01', to: '2023-03-01' })).toEqual({
      from: '2023-01-01',
      to: '2023-03-01',
    });
    expect(walletSpan(buildWallet([], new Map(), wallet.today))).toEqual({
      from: wallet.today,
      to: wallet.today,
    });
  });
});
