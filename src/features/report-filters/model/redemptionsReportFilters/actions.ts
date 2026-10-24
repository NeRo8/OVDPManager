import { toggledIsins } from '../reportScope';
import { initialState, useRedemptionsReportFiltersStore } from './store';
import type { RedemptionsReportFiltersState } from './types';

export function updateRedemptionsReportFilters(
  patch: Partial<RedemptionsReportFiltersState>,
): void {
  useRedemptionsReportFiltersStore.setState(patch);
}

/** Adds the bond to the reported ones, or removes it. */
export function toggleRedemptionsReportIsin(isin: string): void {
  useRedemptionsReportFiltersStore.setState(({ isins }) => ({ isins: toggledIsins(isins, isin) }));
}

export function resetRedemptionsReportFilters(): void {
  useRedemptionsReportFiltersStore.setState(initialState);
}
