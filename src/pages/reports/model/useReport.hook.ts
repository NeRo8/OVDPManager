import { useWallet } from '@/entities/portfolio';
import { type ReportName, fitReportFilters, useReportFilters } from '@/features/report-filters';

/**
 * A report's saved filters fitted to the active plan's wallet: what the report covers, the wallet
 * narrowed to it (`narrowed`) and the whole one (`wallet`), which ends the report and refreshes it.
 */
export function useReport<R extends ReportName>(report: R) {
  const wallet = useWallet();
  const saved = useReportFilters(report);
  return { wallet, ...fitReportFilters(report, saved, wallet) };
}
