import type { RedemptionTime } from '@/features/report-filters';

export const REDEMPTION_TIME_LABELS: Record<RedemptionTime, string> = {
  upcoming: 'Майбутні',
  past: 'Отримані',
  all: 'Усі',
};

/** What the report says when the time picked has no redemptions. */
export const NO_REDEMPTIONS: Record<RedemptionTime, string> = {
  upcoming: 'Майбутніх погашень немає.',
  past: 'Отриманих погашень немає.',
  all: 'Погашень немає.',
};
