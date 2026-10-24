import { toggledIsins } from '../reportScope';
import { initialState, useStructureReportFiltersStore } from './store';
import type { StructureReportFiltersState } from './types';

export function updateStructureReportFilters(patch: Partial<StructureReportFiltersState>): void {
  useStructureReportFiltersStore.setState(patch);
}

/** Adds the bond to the reported ones, or removes it. */
export function toggleStructureReportIsin(isin: string): void {
  useStructureReportFiltersStore.setState(({ isins }) => ({ isins: toggledIsins(isins, isin) }));
}

export function resetStructureReportFilters(): void {
  useStructureReportFiltersStore.setState(initialState);
}
