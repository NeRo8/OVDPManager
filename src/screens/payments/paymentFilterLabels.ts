import type { ScheduleEventType, ScheduleTimeFilter } from '@/stores/paymentFilters';

export const EVENT_TYPE_LABELS: Record<ScheduleEventType, string> = {
  coupon: 'Купони',
  redemption: 'Погашення',
  purchase: 'Купівлі',
  sale: 'Продажі',
};

export const TIME_LABELS: Record<ScheduleTimeFilter, string> = {
  all: 'Усі',
  upcoming: 'Майбутні',
  past: 'Минулі',
};
