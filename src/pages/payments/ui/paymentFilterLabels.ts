import type { ScheduleEventType, ScheduleTimeFilter } from '@/features/payment-filters';

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
