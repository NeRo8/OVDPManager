import { SCHEDULE_EVENT_TYPES } from '../scheduleEventTypes';
import { initialState, usePaymentFiltersStore } from './store';
import type { PaymentFilters, ScheduleEventType } from './types';

export function updatePaymentFilters(patch: Partial<PaymentFilters>): void {
  usePaymentFiltersStore.setState(patch);
}

/** Adds the event type to the shown ones, or removes it; every type chosen is the same as none. */
export function togglePaymentFilterType(type: ScheduleEventType): void {
  usePaymentFiltersStore.setState(({ types }) => {
    const next = types.includes(type) ? types.filter((t) => t !== type) : [...types, type];
    return { types: next.length === SCHEDULE_EVENT_TYPES.length ? [] : next };
  });
}

/** Adds the bond to the shown ones, or removes it. */
export function togglePaymentFilterIsin(isin: string): void {
  usePaymentFiltersStore.setState(({ isins }) => ({
    isins: isins.includes(isin) ? isins.filter((i) => i !== isin) : [...isins, isin],
  }));
}

export function resetPaymentFilters(): void {
  usePaymentFiltersStore.setState(initialState);
}
