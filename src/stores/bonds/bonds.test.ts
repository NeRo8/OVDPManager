import type { Bond } from '@/lib/portfolio/portfolio';
import { resetBondPickerFilters, saveBonds, updateBondPickerFilters } from '@/stores/bonds';

import { initialState, useBondsStore } from './store';

const pickerFilters = () => useBondsStore.getState().filters;

beforeEach(() => useBondsStore.setState(initialState));

describe('bond picker filters', () => {
  it('keeps what is not changed, and resets to the default order', () => {
    updateBondPickerFilters({ currency: 'USD' });
    updateBondPickerFilters({ sort: 'rate' });
    expect(pickerFilters()).toEqual({
      ...initialState.filters,
      currency: 'USD',
      sort: 'rate',
    });
    resetBondPickerFilters();
    expect(pickerFilters()).toEqual(initialState.filters);
  });

  it('stays as picked when NBU sends a new catalog', () => {
    updateBondPickerFilters({ term: 'short' });
    saveBonds([] as Bond[], 1);
    expect(pickerFilters().term).toBe('short');
  });
});
