import type { Period, PeriodOption } from '@/features/report-filters';
import { formatDate } from '@/shared/lib';

export const PERIOD_LABELS: Record<PeriodOption, string> = {
  month: 'Цей місяць',
  lastMonth: 'Минулий місяць',
  quarter: 'Цей квартал',
  lastQuarter: 'Минулий квартал',
  yearToDate: 'З початку року',
  last12Months: 'Останні 12 місяців',
  plan: 'Увесь план',
  custom: 'Власний період',
};

/** 01.10.2026 – 31.10.2026 */
export const formatPeriod = ({ from, to }: Period) => `${formatDate(from)} – ${formatDate(to)}`;
