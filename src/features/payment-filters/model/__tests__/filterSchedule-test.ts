import { type Bond, type Purchase, buildWallet, walletScopeOptions } from '@/entities/portfolio';

import { effectiveFilters, filterSchedule } from '../filterSchedule';
import type { PaymentFilters } from '../paymentFilters';

function bondOf(isin: string, currency: Bond['currency']): Bond {
  return {
    isin,
    nominal: 1000,
    rate: 10,
    currency,
    issueDate: '2024-01-01',
    maturityDate: '2026-07-01',
    description: '',
    payments: [
      { date: '2025-07-01', type: 'coupon', amount: 50 },
      { date: '2026-07-01', type: 'redemption', amount: 1000 },
    ],
  };
}

const hryvnia = bondOf('UA4000000001', 'UAH');
const dollar = bondOf('UA4000000002', 'USD');
const byIsin = new Map([hryvnia, dollar].map((bond) => [bond.isin, bond]));

function purchase(bond: Bond, purchaseDate: string): Purchase {
  return {
    id: purchaseDate + bond.isin,
    isin: bond.isin,
    currency: bond.currency,
    purchaseDate,
    amount: 990,
    quantity: 1,
  };
}

const wallet = buildWallet(
  [
    purchase(hryvnia, '2025-01-10'),
    purchase(dollar, '2025-02-10'),
    purchase(hryvnia, '2026-05-01'),
  ],
  byIsin,
  '2026-03-15',
);
const fresh: PaymentFilters = { types: [], time: 'all', currency: null, isins: [] };

describe('effectiveFilters', () => {
  it('shows the first currency the wallet has when none or a missing one is saved', () => {
    const options = walletScopeOptions(wallet);
    expect(effectiveFilters(fresh, options).currency).toBe('UAH');
    expect(effectiveFilters({ ...fresh, currency: 'EUR' }, options).currency).toBe('UAH');
    expect(effectiveFilters({ ...fresh, currency: 'USD' }, options).currency).toBe('USD');
  });
});

describe('filterSchedule', () => {
  it('keeps the currency picked, payments before purchases on the same day', () => {
    const { events, totalCount } = filterSchedule(wallet, { ...fresh, currency: 'UAH' });
    expect(events.map(({ date, type }) => `${date} ${type}`)).toEqual([
      '2025-01-10 purchase',
      '2025-07-01 coupon',
      '2026-05-01 purchase',
      '2026-07-01 redemption',
    ]);
    expect(totalCount).toBe(7);
  });

  it('keeps the types and the time picked: upcoming are payments ahead and planned purchases', () => {
    const upcoming = filterSchedule(wallet, { ...fresh, currency: 'UAH', time: 'upcoming' });
    expect(upcoming.events.map(({ type }) => type)).toEqual(['purchase', 'redemption']);
    const coupons = filterSchedule(wallet, { ...fresh, currency: 'UAH', types: ['coupon'] });
    expect(coupons.events.map(({ type }) => type)).toEqual(['coupon']);
  });
});
