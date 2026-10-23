import {
  SCHEDULE_EVENT_TYPES,
  type PaymentFilters,
  type ScheduleEventType,
  type ScheduleTimeFilter,
} from '@/features/payment-filters';

export const EVENT_TYPE_LABELS: Record<ScheduleEventType, string> = {
  coupon: 'Купони',
  redemption: 'Погашення',
  purchase: 'Купівлі',
};

export const TIME_LABELS: Record<ScheduleTimeFilter, string> = {
  all: 'Усі',
  upcoming: 'Майбутні',
  past: 'Минулі',
};

/** The filters in use, in a line: "купони, погашення · майбутні · ОВДП: 2". */
export function describePaymentFilters({ types, time, isins }: PaymentFilters): string {
  return [
    SCHEDULE_EVENT_TYPES.filter((type) => types.includes(type))
      .map((type) => EVENT_TYPE_LABELS[type].toLowerCase())
      .join(', '),
    time !== 'all' && TIME_LABELS[time].toLowerCase(),
    isins.length > 0 && `ОВДП: ${isins.length}`,
  ]
    .filter(Boolean)
    .join(' · ');
}
