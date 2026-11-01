import {
  type Bond,
  isinsIn,
  type Purchase,
  buildWallet,
  walletScopeOptions,
} from '@/entities/portfolio';

import { countActiveFilters, effectiveFilters, filterSchedule } from '../filterSchedule';
import type { PaymentFilters } from '../paymentFilters';
import { resetPaymentFilters, togglePaymentFilterType } from '../paymentFilters/actions';
import { usePaymentFiltersStore } from '../paymentFilters/store';

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

  it('keeps only the bonds of the currency shown, so picking another one hides nothing', () => {
    const options = walletScopeOptions(wallet);
    const picked = { ...fresh, isins: [hryvnia.isin] };
    expect(effectiveFilters({ ...picked, currency: 'USD' }, options).isins).toEqual([]);
    expect(effectiveFilters({ ...picked, currency: 'UAH' }, options).isins).toEqual([hryvnia.isin]);
    expect(isinsIn(options, 'USD')).toEqual([dollar.isin]);
  });

  it('counts each distinct active filter including an empty event selection', () => {
    const options = walletScopeOptions(wallet);
    expect(countActiveFilters({ ...fresh, currency: 'UAH' }, options)).toBe(0);
    expect(
      countActiveFilters(
        { ...fresh, currency: 'USD', excludeAllTypes: true, time: 'past', isins: [dollar.isin] },
        options,
      ),
    ).toBe(4);
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
    expect(totalCount).toBe(4);
  });

  it('keeps the types and the time picked: upcoming are payments ahead and planned purchases', () => {
    const upcoming = filterSchedule(wallet, { ...fresh, currency: 'UAH', time: 'upcoming' });
    expect(upcoming.events.map(({ type }) => type)).toEqual(['purchase', 'redemption']);
    const coupons = filterSchedule(wallet, { ...fresh, currency: 'UAH', types: ['coupon'] });
    expect(coupons.events.map(({ type }) => type)).toEqual(['coupon']);
    expect(coupons.totalCount).toBe(4);
  });

  it('allows filtering purchases of a bond missing from NBU data', () => {
    const unknown = { ...purchase(hryvnia, '2025-03-01'), isin: 'UA4000000099' };
    const withUnknown = buildWallet([...wallet.purchases, unknown], byIsin, wallet.today);
    const options = walletScopeOptions(withUnknown);
    expect(options.isins).toContain(unknown.isin);
    const filters = effectiveFilters({ ...fresh, currency: 'UAH', isins: [unknown.isin] }, options);
    expect(filterSchedule(withUnknown, filters).events.map(({ isin }) => isin)).toEqual([
      unknown.isin,
    ]);
  });
});

it('keeps no events selected after the last type is unchecked', () => {
  resetPaymentFilters();
  togglePaymentFilterType('coupon');
  togglePaymentFilterType('coupon');
  const none = usePaymentFiltersStore.getState();
  expect(none.excludeAllTypes).toBe(true);
  expect(filterSchedule(wallet, { ...none, currency: 'UAH' }).events).toEqual([]);
  togglePaymentFilterType('purchase');
  expect(usePaymentFiltersStore.getState()).toMatchObject({
    types: ['purchase'],
    excludeAllTypes: false,
  });
  resetPaymentFilters();
});
