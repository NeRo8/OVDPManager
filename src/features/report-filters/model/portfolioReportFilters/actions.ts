import { toggledIsins } from '../reportScope';
import { initialState, usePortfolioReportFiltersStore } from './store';
import type { PortfolioReportFiltersState } from './types';

export function updatePortfolioReportFilters(patch: Partial<PortfolioReportFiltersState>): void {
  usePortfolioReportFiltersStore.setState(patch);
}

/** Adds the bond to the reported ones, or removes it. */
export function togglePortfolioReportIsin(isin: string): void {
  usePortfolioReportFiltersStore.setState(({ isins }) => ({ isins: toggledIsins(isins, isin) }));
}

export function resetPortfolioReportFilters(): void {
  usePortfolioReportFiltersStore.setState(initialState);
}
