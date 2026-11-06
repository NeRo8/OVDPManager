import { MONTHS, MONTHS_SHORT } from '@/utils/format';

/** ISO months get compact labels and full names for screen readers. */
export function periodColumn(period: string): { label: string; name: string } {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return { label: period, name: period };
  const month = Number(period.slice(5, 7)) - 1;
  return { label: MONTHS_SHORT[month], name: `${MONTHS[month]} ${period.slice(0, 4)}` };
}
