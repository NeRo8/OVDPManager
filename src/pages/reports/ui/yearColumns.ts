import type { ChartColumn } from '@/shared/ui';

/** More years than fit full under the columns: '26 instead of 2026. */
const FULL_YEAR_LABELS = 6;

/** A chart column per year. */
export const yearColumns = (years: number[]): ChartColumn[] =>
  years.map((year) => ({
    label: years.length > FULL_YEAR_LABELS ? `’${String(year).slice(2)}` : String(year),
    name: `${year} рік`,
  }));
