import { addDaysISO } from '@/shared/lib';

/** A rate NBU published on a date */
export type DatedRate = { date: string; rate: number };

/**
 * NBU publishes some rates only on working days: those dates are filled with the rate in effect
 * on them, so a year can be read on any date.
 */
export function fillDailyRates(
  rows: DatedRate[],
  firstDate: string,
  throughDate: string,
  missing: (date: string) => string,
): Record<string, number> {
  const sorted = [...rows].sort((first, second) => first.date.localeCompare(second.date));
  const rates: Record<string, number> = {};
  let latest: number | undefined;
  let rowIndex = 0;
  for (let date = firstDate; date <= throughDate; date = addDaysISO(date, 1)) {
    while (rowIndex < sorted.length && sorted[rowIndex].date <= date) {
      latest = sorted[rowIndex].rate;
      rowIndex += 1;
    }
    if (latest === undefined) throw new Error(missing(date));
    rates[date] = latest;
  }
  return rates;
}
