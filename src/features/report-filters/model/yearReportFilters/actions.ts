import { initialState, useYearReportFiltersStore } from './store';
import type { YearReportFiltersState } from './types';

export function updateYearReportFilters(patch: Partial<YearReportFiltersState>): void {
  useYearReportFiltersStore.setState(patch);
}

/** Picks the year; the default one is saved as none, so the report follows the calendar again. */
export function chooseYearReportYear(year: number, defaultYear: number): void {
  useYearReportFiltersStore.setState({ year: year === defaultYear ? null : year });
}

/** Adds the bond to the reported ones, or removes it. */
export function toggleYearReportIsin(isin: string): void {
  useYearReportFiltersStore.setState(({ isins }) => ({
    isins: isins.includes(isin) ? isins.filter((i) => i !== isin) : [...isins, isin],
  }));
}

export function resetYearReportFilters(): void {
  useYearReportFiltersStore.setState(initialState);
}
