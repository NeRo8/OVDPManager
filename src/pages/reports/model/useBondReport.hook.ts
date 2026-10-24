import { useKeyRates } from '@/entities/portfolio';
import { useReport } from './useReport.hook';

/** The bond picked for the bond report, the nearest to maturity at first, and its key rates. */
export function useBondReport() {
  const report = useReport('bond');
  const { isin, choices } = report.filters;
  const item = choices.find(({ position }) => position.isin === isin);
  const keyRateOn = useKeyRates(
    item?.position.purchases.map((purchase) => purchase.purchaseDate) ?? [],
  );
  return { ...report, item, keyRateOn };
}
