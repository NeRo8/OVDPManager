import { useKeyRates } from '@/entities/portfolio';
import { useReport } from './useReport.hook';
import { purchaseDates } from './yieldReport';

/** The yield report's filters, and the NBU key rate today and on every purchase date. */
export function useYieldReport() {
  const report = useReport('yield');
  const keyRateOn = useKeyRates([...purchaseDates(report.wallet), report.wallet.today]);
  return { ...report, keyRateOn };
}
