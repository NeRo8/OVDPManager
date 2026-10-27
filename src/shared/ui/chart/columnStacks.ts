import { formatMoney } from '@/shared/lib';
import type { SeriesColor } from '@/shared/theme';
import { chartGrid, type ChartGrid } from './chartGrid';

export type ChartSeries = {
  label: string;
  color: SeriesColor;
  values: number[];
  direction?: 'up' | 'down';
};

export type ChartColumn = {
  label: string;
  name: string;
};

export type ChartValueFormat = 'money' | 'percent';

export type ColumnStacks = {
  /** Series stacked above the baseline, then those below it */
  up: ChartSeries[];
  down: ChartSeries[];
  /** Each column's sum of positive values, above and below */
  upTotals: number[];
  downTotals: number[];
  /** A grid from the largest stack below zero to the largest above it */
  grid: ChartGrid;
};

/** The columns' stacks above and below zero, on one shared scale in either orientation. */
export function columnStacks(columns: ChartColumn[], series: ChartSeries[]): ColumnStacks {
  const up = series.filter((item) => item.direction !== 'down');
  const down = series.filter((item) => item.direction === 'down');
  const totals = (group: ChartSeries[]) =>
    columns.map((_, column) =>
      group.reduce((sum, item) => sum + Math.max(0, item.values[column] ?? 0), 0),
    );
  const upTotals = totals(up);
  const downTotals = totals(down);
  const grid = chartGrid(-Math.max(0, ...downTotals), Math.max(0, ...upTotals));
  return { up, down, upTotals, downTotals, grid };
}

const percentFormat = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 });

/** A value in full, as screen readers announce it: money in the currency, or a percent. */
export function formatChartValue(
  value: number,
  valueFormat: ChartValueFormat,
  currency: string,
): string {
  return valueFormat === 'percent'
    ? `${percentFormat.format(value)} %`
    : formatMoney(value, currency);
}

/** What a column holds in words, for its touch slot: «Березень: Купони 120 ₴, Купівлі −1 000 ₴» */
export function describeColumn(
  column: ChartColumn,
  index: number,
  series: ChartSeries[],
  valueFormat: ChartValueFormat,
  currency: string,
): string {
  const parts = series
    .filter((item) => item.values[index] > 0)
    .map(
      (item) =>
        `${item.label} ${item.direction === 'down' ? '−' : ''}${formatChartValue(item.values[index], valueFormat, currency)}`,
    );
  return `${column.name}: ${parts.length ? parts.join(', ') : 'нічого немає'}`;
}
