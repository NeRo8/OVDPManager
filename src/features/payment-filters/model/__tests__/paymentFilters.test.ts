import {
  resetPaymentFilters,
  togglePaymentFilterIsin,
  togglePaymentFilterType,
  updatePaymentFilters,
} from '../paymentFilters';
import { initialState, usePaymentFiltersStore } from '../paymentFilters/store';

const filters = () => usePaymentFiltersStore.getState();

beforeEach(() => resetPaymentFilters());

describe('payment filters', () => {
  it('shows every type again once the last type picked is unchecked, or every type is picked', () => {
    togglePaymentFilterType('coupon');
    expect(filters().types).toEqual(['coupon']);
    togglePaymentFilterType('coupon');
    expect(filters().types).toEqual([]);

    togglePaymentFilterType('coupon');
    togglePaymentFilterType('redemption');
    togglePaymentFilterType('purchase');
    expect(filters().types).toEqual([]);
  });

  it('adds a bond to those shown or takes it away, none left showing every bond', () => {
    togglePaymentFilterIsin('UA1');
    togglePaymentFilterIsin('UA2');
    expect(filters().isins).toEqual(['UA1', 'UA2']);
    togglePaymentFilterIsin('UA1');
    expect(filters().isins).toEqual(['UA2']);
    togglePaymentFilterIsin('UA2');
    expect(filters().isins).toEqual([]);
  });

  it('keeps what is not changed, and resets to every event of the first currency', () => {
    updatePaymentFilters({ currency: 'USD', time: 'past' });
    togglePaymentFilterIsin('UA1');
    expect(filters()).toEqual({ ...initialState, currency: 'USD', time: 'past', isins: ['UA1'] });
    resetPaymentFilters();
    expect(filters()).toEqual(initialState);
  });
});
