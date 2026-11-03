import type { Bond, Operation } from '@/lib/portfolio/portfolio';
import { isinsIn, buildWallet, walletScopeOptions } from '@/lib/portfolio/wallet';
import type { PaymentFilters } from '@/stores/paymentFilters';

import { countActiveFilters, effectiveFilters, filterSchedule } from './filterSchedule';

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

function purchase(bond: Bond, date: string): Operation {
  return {
    type: 'purchase',
    ovdp: null,
    id: date + bond.isin,
    isin: bond.isin,
    currency: bond.currency,
    date,
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

  it('keeps only the bonds of the currency shown, so picking another one hides nothing', () => {
    const options = walletScopeOptions(wallet);
    const picked = { ...fresh, isins: [hryvnia.isin] };
    expect(effectiveFilters({ ...picked, currency: 'USD' }, options).isins).toEqual([]);
    expect(effectiveFilters({ ...picked, currency: 'UAH' }, options).isins).toEqual([hryvnia.isin]);
    expect(isinsIn(options, 'USD')).toEqual([dollar.isin]);
  });

  it('counts each distinct active filter', () => {
    const options = walletScopeOptions(wallet);
    expect(countActiveFilters({ ...fresh, currency: 'UAH' }, options)).toBe(0);
    expect(
      countActiveFilters(
        { ...fresh, currency: 'USD', types: ['coupon'], time: 'past', isins: [dollar.isin] },
        options,
      ),
    ).toBe(4);
  });
});

describe('filterSchedule', () => {
  it('keeps the currency picked, payments before operations on the same day', () => {
    const { events, totalCount } = filterSchedule(wallet, { ...fresh, currency: 'UAH' });
    expect(events.map(({ date, type }) => `${date} ${type}`)).toEqual([
      '2025-01-10 purchase',
      '2025-07-01 coupon',
      '2026-05-01 purchase',
      '2026-07-01 redemption',
    ]);
    expect(totalCount).toBe(4);
  });

  it('keeps the types and the time picked: upcoming are payments ahead and planned operations', () => {
    const upcoming = filterSchedule(wallet, { ...fresh, currency: 'UAH', time: 'upcoming' });
    expect(upcoming.events.map(({ type }) => type)).toEqual(['purchase', 'redemption']);
    const coupons = filterSchedule(wallet, { ...fresh, currency: 'UAH', types: ['coupon'] });
    expect(coupons.events.map(({ type }) => type)).toEqual(['coupon']);
    expect(coupons.totalCount).toBe(4);
  });

  it('counts the events of the currency shown before the other filters, no other currency’s', () => {
    const coupons = filterSchedule(wallet, { ...fresh, currency: 'USD', types: ['coupon'] });
    expect(coupons.events.map(({ type }) => type)).toEqual(['coupon']);
    // The dollar bond's purchase, coupon and redemption; the hryvnia ones are not counted.
    expect(coupons.totalCount).toBe(3);
  });

  it('allows filtering operations of a bond missing from NBU data', () => {
    const unknown = { ...purchase(hryvnia, '2025-03-01'), isin: 'UA4000000099' };
    const withUnknown = buildWallet([...wallet.operations, unknown], byIsin, wallet.today);
    const options = walletScopeOptions(withUnknown);
    expect(options.isins).toContain(unknown.isin);
    const filters = effectiveFilters({ ...fresh, currency: 'UAH', isins: [unknown.isin] }, options);
    expect(filterSchedule(withUnknown, filters).events.map(({ isin }) => isin)).toEqual([
      unknown.isin,
    ]);
  });
});
