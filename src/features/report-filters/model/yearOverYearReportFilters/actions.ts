import { toggledIsins } from '../reportScope';
import { initialState, useYearOverYearReportFiltersStore } from './store';
import type { YearOverYearReportFiltersState } from './types';

export function updateYearOverYearReportFilters(
  patch: Partial<YearOverYearReportFiltersState>,
): void {
  useYearOverYearReportFiltersStore.setState(patch);
}

/** Adds the bond to the reported ones, or removes it. */
export function toggleYearOverYearReportIsin(isin: string): void {
  useYearOverYearReportFiltersStore.setState(({ isins }) => ({ isins: toggledIsins(isins, isin) }));
}

export function resetYearOverYearReportFilters(): void {
  useYearOverYearReportFiltersStore.setState(initialState);
}
