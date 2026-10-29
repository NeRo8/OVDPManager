import { initialState, useReportFiltersStore } from './store';
import type {
  Period,
  PeriodOption,
  ReportFiltersState,
  ReportName,
  ScopedReportName,
} from './types';

export function updateReportFilters<R extends ReportName>(
  report: R,
  patch: Partial<ReportFiltersState[R]>,
): void {
  useReportFiltersStore.setState(
    (state) => ({ [report]: { ...state[report], ...patch } }) as Partial<ReportFiltersState>,
  );
}

/** Adds the bond to those the report covers, or removes it. */
export function toggleReportIsin(report: ScopedReportName, isin: string): void {
  const { isins } = useReportFiltersStore.getState()[report];
  updateReportFilters(report, {
    isins: isins.includes(isin) ? isins.filter((i) => i !== isin) : [...isins, isin],
  });
}

export function resetReportFilters(report: ReportName): void {
  updateReportFilters(report, initialState[report]);
}

/** Picks the year; the default one is saved as none, so the report follows the calendar again. */
export function chooseReportYear(report: 'year', year: number, defaultYear: number): void {
  updateReportFilters(report, { year: year === defaultYear ? null : year });
}

/** Picks the period; the own one starts from the dates shown, so they are there to adjust. */
export function chooseReportPeriod(period: PeriodOption, shown: Period): void {
  updateReportFilters('period', period === 'custom' ? { period, custom: shown } : { period });
}

/** Picks the bond; the default one is saved as none, so the report follows the wallet again. */
export function chooseReportBond(isin: string, defaultIsin: string | undefined): void {
  updateReportFilters('bond', { isin: isin === defaultIsin ? null : isin });
}
