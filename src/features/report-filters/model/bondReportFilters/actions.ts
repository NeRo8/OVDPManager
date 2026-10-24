import { initialState, useBondReportFiltersStore } from './store';

/** Picks the bond; the default one is saved as none, so the report follows the wallet again. */
export function chooseBondReportIsin(isin: string, defaultIsin: string | undefined): void {
  useBondReportFiltersStore.setState({ isin: isin === defaultIsin ? null : isin });
}

export function resetBondReportFilters(): void {
  useBondReportFiltersStore.setState(initialState);
}
