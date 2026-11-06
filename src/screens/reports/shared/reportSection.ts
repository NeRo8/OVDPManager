import type { SeriesColor } from '@/theme/series';

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
