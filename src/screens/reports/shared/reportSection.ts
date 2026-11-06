import type { SeriesColor } from '@/theme/series';

import type { FlowPeriod } from './flowChartData';

export type ReportRow = { label: string; value: string };

export type ReportTable = {
  firstColumn?: string;
  currency?: string;
  columns: string[];
  rows: { label: string; values: string[] }[];
};

export type ReportCapitalChart = {
  currency: string;
  dates: string[];
  positions: number[];
  actualAvailable: boolean;
  series: { label: string; color: SeriesColor; values: number[] }[];
};

export type ReportAllocationChart = {
  currency: string;
  slices: { label: string; value: number }[];
};

export type ReportSection = {
  title: string;
  rows: ReportRow[];
  footer?: string;
  table?: ReportTable;
  capitalChart?: ReportCapitalChart;
  allocationChart?: ReportAllocationChart;
  flowChart?: { currency: string; periods: FlowPeriod[]; showPlanned: boolean };
  chart?: {
    title?: string;
    currency: string;
    percent?: boolean;
    bars: { label: string; value: number }[];
  };
  lineChart?: {
    labels: string[];
    series: { label: string; values: number[] }[];
    positions?: number[];
    step?: boolean;
  };
};
