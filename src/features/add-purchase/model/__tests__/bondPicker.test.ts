import type { Bond } from '@/entities/portfolio';

import { bondPicker } from '../bondPicker';
import type { BondPickerFiltersState } from '../bondPickerFilters';

const today = '2026-10-31';

const bondOf = (isin: string, fields: Partial<Bond>): Bond => ({
  isin,
  nominal: 1000,
  rate: 16,
  currency: 'UAH',
  issueDate: '2026-01-01',
  maturityDate: '2027-06-01',
  description: '',
  payments: [],
  ...fields,
});

const bonds = [
  bondOf('UA4000000001', { maturityDate: '2027-10-31', rate: 15 }),
  bondOf('UA4000000002', { maturityDate: '2027-11-01', rate: 17 }),
  bondOf('UA4000000003', { maturityDate: '2030-01-01', rate: 17 }),
  bondOf('UA4000000004', { maturityDate: '2027-03-01', currency: 'USD', rate: 4 }),
  // Matures today: no longer for sale, so out of the list without a search.
  bondOf('UA4000000005', { maturityDate: today, rate: 20 }),
];

const fresh: BondPickerFiltersState = { currency: null, term: 'all', sort: 'maturity' };
const isins = (list: Bond[]) => list.map((bond) => bond.isin.slice(-1));

describe('bondPicker', () => {
  it('offers the currencies with bonds for sale, the first of them by default', () => {
    const picker = bondPicker(bonds, fresh, '', today);
    expect(picker.currencies).toEqual([
      { value: 'UAH', count: 3 },
      { value: 'USD', count: 1 },
    ]);
    expect(picker.currency).toBe('UAH');
    expect(isins(picker.choices)).toEqual(['1', '2', '3']);
    expect(picker.activeFilterCount).toBe(0);
  });

  it('keeps a chosen currency with no bonds for sale, at zero, and counts it as a filter', () => {
    const picker = bondPicker(bonds, { ...fresh, currency: 'EUR' }, '', today);
    expect(picker.currencies.at(-1)).toEqual({ value: 'EUR', count: 0 });
    expect(picker.currency).toBe('EUR');
    expect(picker.choices).toEqual([]);
    expect(picker.activeFilterCount).toBe(1);
  });

  it('counts the terms in the currency shown, the last day of a year still within it', () => {
    const picker = bondPicker(bonds, { ...fresh, term: 'short' }, '', today);
    expect(picker.terms).toEqual([
      { value: 'all', count: 3 },
      { value: 'short', count: 1 },
      { value: 'medium', count: 1 },
      { value: 'long', count: 1 },
    ]);
    expect(isins(picker.choices)).toEqual(['1']);
    expect(picker.filteredCount).toBe(1);
  });

  it('sorts by rate from the highest, the nearer maturity first on equal rates', () => {
    const picker = bondPicker(bonds, { ...fresh, sort: 'rate' }, '', today);
    expect(isins(picker.choices)).toEqual(['2', '3', '1']);
    expect(picker.activeFilterCount).toBe(1);
  });

  it('searches every bond, the one maturing today included, setting the filters aside', () => {
    const picker = bondPicker(bonds, { ...fresh, currency: 'USD', term: 'long' }, '20%', today);
    expect(picker.isSearching).toBe(true);
    expect(isins(picker.choices)).toEqual(['5']);
    expect(picker.filteredCount).toBe(0);
  });
});
