import { useKeyRates, useWallet } from '@/entities/portfolio';
import {
  countBondReportFilters,
  reportBondIsin,
  useBondReportFilters,
} from '@/features/report-filters';
import { bondChoicesByMaturity } from './bondReport';

/** The bond picked for the bond report, the nearest to maturity at first, and its key rates. */
export function useBondReport() {
  const wallet = useWallet();
  const choices = bondChoicesByMaturity(wallet);
  const isins = choices.map(({ position }) => position.isin);
  const filters = useBondReportFilters();
  const isin = reportBondIsin(filters, isins);
  const item = choices.find(({ position }) => position.isin === isin);
  const keyRateOn = useKeyRates(
    item?.position.purchases.map((purchase) => purchase.purchaseDate) ?? [],
  );

  return {
    wallet,
    choices,
    isin,
    defaultIsin: isins[0],
    item,
    keyRateOn,
    activeFilterCount: countBondReportFilters(filters, isins),
  };
}
