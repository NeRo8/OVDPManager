import type { BondKind, Currency, PlanOperation, ScheduleEvent } from '@/lib/portfolio/portfolio';

export type ScheduleEventType = ScheduleEvent['type'];
/** Events still ahead (payments not yet received, planned operations), those behind, or both. */
export type ScheduleTimeFilter = 'all' | 'upcoming' | 'past';

/**
 * The payments schedule's filters over the wallet's events; one set for the app, not per plan.
 * Every change applies at once and is remembered.
 */
export type PaymentFilters = {
  kind?: BondKind | 'unknown' | 'all';
  /** Event types to show; empty shows every type, as does every type picked */
  types: ScheduleEventType[];
  time: ScheduleTimeFilter;
  /**
   * The chart has one money scale, so the schedule shows one currency. Null, or a currency the
   * wallet no longer has: the first currency that it has.
   */
  currency: Currency | null;
  /** Bonds to show; empty shows every bond */
  isins: string[];
};

export type OperationsState = {
  /** Purchases of every plan */
  operations: PlanOperation[];
  filters: PaymentFilters;
};
