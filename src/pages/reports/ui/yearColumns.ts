import type { ChartColumn } from '@/shared/ui';

/** More years than fit full under the columns: '26 instead of 2026. */
const FULL_YEAR_LABELS = 6;

/** A chart column per year; a year whose sums are partly a forecast is starred, as in tables. */
export const yearColumns = (years: number[], forecast: boolean[] = []): ChartColumn[] =>
  years.map((year, index) => {
    const star = forecast[index] ? '*' : '';
    return {
      label: `${years.length > FULL_YEAR_LABELS ? `’${String(year).slice(2)}` : year}${star}`,
      name: `${year} рік${star && ', прогноз'}`,
    };
  });
