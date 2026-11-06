import { formatGridTick } from '@/components/chart/chartGrid';
import { chartPalette } from '@/components/chart/chartTheme';
import type { ChartSeries } from '@/components/chart/columnStacks';
import { light } from '@/theme/palette';

import { flowChartData, horizontalFlowStacks } from './flowChartData';
import type { ReportSection } from './reportSection';

export function flowChartPdf(
  chart: NonNullable<ReportSection['flowChart']>,
  escape: (value: string) => string,
): string {
  const { columns, series } = flowChartData(chart.periods, chart.showPlanned);
  if (!columns.length) return '';
  const { up, down, grid } = horizontalFlowStacks(columns, series);
  const palette = chartPalette(light);
  const negative = -grid.min;
  const positive = grid.max;
  const range = negative + positive;
  const side = (items: ChartSeries[], index: number, bound: number, reverse: boolean) => {
    if (!bound) return '';
    const bars = items
      .map((item) => {
        const width = (Math.max(0, item.values[index] ?? 0) / bound) * 100;
        return `<span style="width:${width}%;background:${palette.marks[item.color]}"></span>`;
      })
      .join('');
    return `<div class="flow-side${reverse ? ' flow-negative' : ''}" style="width:${(bound / range) * 100}%">${bars}</div>`;
  };
  const axis = `<div class="flow-axis"><span>${negative ? escape(formatGridTick(grid.min, grid.step)) : ''}</span><span style="left:${(negative / range) * 100}%">0</span><span>${positive ? escape(formatGridTick(grid.max, grid.step)) : ''}</span></div>`;
  const rows = columns
    .map(
      (column, index) =>
        `<tr><td>${escape(column.label)}</td><td><div class="flow-plot">${side(down, index, negative, true)}${side(up, index, positive, false)}</div></td></tr>`,
    )
    .join('');
  const legend = series
    .map(
      (item) => `<span style="color:${palette.marks[item.color]}">■</span> ${escape(item.label)}`,
    )
    .join(' · ');
  return `<table class="flow-chart"><thead><tr><th></th><th>${axis}</th></tr></thead><tbody>${rows}</tbody></table><p>${legend}</p>`;
}
