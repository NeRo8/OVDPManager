export type ReportRow = { label: string; value: string };

export type ReportTable = {
  firstColumn?: string;
  currency?: string;
  columns: string[];
  rows: { label: string; values: string[] }[];
};

export type ReportSection = {
  title: string;
  rows: ReportRow[];
  footer?: string;
  table?: ReportTable;
  chart?: {
    title?: string;
    currency: string;
    percent?: boolean;
    bars: { label: string; value: number }[];
  };
  lineChart?: { labels: string[]; series: { label: string; values: number[] }[] };
};
