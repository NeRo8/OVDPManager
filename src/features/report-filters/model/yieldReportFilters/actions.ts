import { toggledIsins } from '../reportScope';
import { initialState, useYieldReportFiltersStore } from './store';
import type { YieldReportFiltersState } from './types';

export function updateYieldReportFilters(patch: Partial<YieldReportFiltersState>): void {
  useYieldReportFiltersStore.setState(patch);
}

/** Adds the bond to the reported ones, or removes it. */
export function toggleYieldReportIsin(isin: string): void {
  useYieldReportFiltersStore.setState(({ isins }) => ({ isins: toggledIsins(isins, isin) }));
}

export function resetYieldReportFilters(): void {
  useYieldReportFiltersStore.setState(initialState);
}
