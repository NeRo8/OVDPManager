import type { Bond, Operation } from '@/lib/portfolio/portfolio';
import { isinsIn, buildWallet, walletScopeOptions } from '@/lib/portfolio/wallet';
import type { PaymentFilters } from '@/stores/operations';

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

const today = '2026-03-15';

/** Planned while ahead of `today`, made (confirmed) before it. */
function purchase(bond: Bond, date: string): Operation {
  return {
    type: 'purchase',
    ovdp: null,
    planned: date > today,
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
  today,
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
  it('filters the selected currency by bond kind and keeps unknown kinds separate', () => {
    const external = { ...hryvnia, isin: 'XS1', kind: 'ozdp' as const };
    const domestic = { ...hryvnia, kind: 'ovdp' as const };
    const mixed = buildWallet(
      [
        purchase(domestic, '2025-01-10'),
        purchase(external, '2025-01-10'),
        purchase(dollar, '2025-01-10'),
      ],
      new Map([domestic, external, dollar].map((bond) => [bond.isin, bond])),
      today,
    );
    const filtered = filterSchedule(mixed, { ...fresh, currency: 'UAH', kind: 'ozdp' });
    expect(filtered.events.length).toBeGreaterThan(0);
    expect(filtered.events.every((event) => event.isin === external.isin)).toBe(true);
    expect(filterSchedule(mixed, { ...fresh, currency: 'UAH', kind: 'unknown' }).events).toEqual(
      [],
    );
  });
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

  it('keeps an operation upcoming until it is confirmed, even once its date has come', () => {
    const overdue = { ...purchase(hryvnia, '2026-03-01'), planned: true };
    const withOverdue = buildWallet([...wallet.operations, overdue], byIsin, today);
    const upcoming = filterSchedule(withOverdue, { ...fresh, currency: 'UAH', time: 'upcoming' });
    expect(upcoming.events.map(({ date }) => date)).toContain('2026-03-01');
    const past = filterSchedule(withOverdue, { ...fresh, currency: 'UAH', time: 'past' });
    expect(past.events.map(({ date }) => date)).not.toContain('2026-03-01');
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

describe('sale filtering and event order', () => {
  it('filters confirmed and overdue planned sales by time and event type', () => {
    const bought = { ...purchase(hryvnia, '2025-01-10'), quantity: 2 };
    const confirmed: Operation = {
      ...purchase(hryvnia, '2026-02-01'),
      id: 'sale-made',
      type: 'sale',
      amount: 1100,
    };
    const planned: Operation = {
      ...purchase(hryvnia, '2026-03-01'),
      id: 'sale-planned',
      type: 'sale',
      planned: true,
    };
    const selected = buildWallet([bought, confirmed, planned], byIsin, today);
    const filters: PaymentFilters = { ...fresh, currency: 'UAH', types: ['sale'] };
    expect(
      filterSchedule(selected, { ...filters, time: 'past' }).events.map((event) => event.date),
    ).toEqual(['2026-02-01']);
    expect(
      filterSchedule(selected, { ...filters, time: 'upcoming' }).events.map((event) => event.date),
    ).toEqual(['2026-03-01']);
  });

  it('orders a coupon before a purchase and sale on the same day', () => {
    const bought = { ...purchase(hryvnia, '2025-01-10'), quantity: 2 };
    const sameDayPurchase = purchase(hryvnia, '2025-07-01');
    const sameDaySale: Operation = {
      ...purchase(hryvnia, '2025-07-01'),
      id: 'same-day-sale',
      type: 'sale',
    };
    const selected = buildWallet([bought, sameDayPurchase, sameDaySale], byIsin, today);
    const sameDay = filterSchedule(selected, { ...fresh, currency: 'UAH' }).events.filter(
      (event) => event.date === '2025-07-01',
    );
    expect(sameDay[0].type).toBe('coupon');
    expect(
      sameDay
        .slice(1)
        .map((event) => event.type)
        .sort(),
    ).toEqual(['purchase', 'sale']);
  });
});
