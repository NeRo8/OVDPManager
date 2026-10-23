import type { ScheduleEvent } from '@/entities/portfolio';

export type ScheduleEventType = ScheduleEvent['type'];
/** Events still ahead (payments not yet received, planned purchases), those behind, or both. */
export type ScheduleTimeFilter = 'all' | 'upcoming' | 'past';

export type PaymentFiltersState = {
  /** Event types to show; empty shows every type */
  types: ScheduleEventType[];
  time: ScheduleTimeFilter;
  /** Bonds to show; empty shows every bond */
  isins: string[];
};

/** The filters as screens and calculations use them. */
export type PaymentFilters = PaymentFiltersState;
