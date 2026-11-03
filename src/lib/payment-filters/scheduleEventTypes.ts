import type { ScheduleEventType } from '@/stores/paymentFilters';

/** Every type of schedule event, in the order the filters list them. */
export const SCHEDULE_EVENT_TYPES: readonly ScheduleEventType[] = [
  'coupon',
  'redemption',
  'purchase',
  'sale',
];
