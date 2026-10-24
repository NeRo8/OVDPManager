import { initialState, usePeriodReportFiltersStore } from './store';
import type { Period, PeriodOption, PeriodReportFiltersState } from './types';

export function updatePeriodReportFilters(patch: Partial<PeriodReportFiltersState>): void {
  usePeriodReportFiltersStore.setState(patch);
}

/** Picks the period; the own one starts from the dates shown, so they are there to adjust. */
export function choosePeriodReportPeriod(period: PeriodOption, shown: Period): void {
  usePeriodReportFiltersStore.setState(
    period === 'custom' ? { period, custom: shown } : { period },
  );
}

/** Adds the bond to the reported ones, or removes it. */
export function togglePeriodReportIsin(isin: string): void {
  usePeriodReportFiltersStore.setState(({ isins }) => ({
    isins: isins.includes(isin) ? isins.filter((i) => i !== isin) : [...isins, isin],
  }));
}

export function resetPeriodReportFilters(): void {
  usePeriodReportFiltersStore.setState(initialState);
}
