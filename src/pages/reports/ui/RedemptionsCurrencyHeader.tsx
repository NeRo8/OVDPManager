import { CURRENCY_NAMES } from '@/entities/portfolio';
import type { CurrencyRedemptions } from '../model/redemptionsReport';
import { RedemptionsChart } from './RedemptionsChart';
import { RedemptionsSummary } from './RedemptionsSummary';
import { RedemptionsTable } from './RedemptionsTable';
import { ReportSectionHeader } from './ReportSectionHeader';

type Props = {
  report: CurrencyRedemptions;
};

/** What comes before a currency's redemptions in the list: their sums, chart and table. */
export function RedemptionsCurrencyHeader({ report }: Props) {
  return (
    <ReportSectionHeader rowsTitle={`Усі погашення · ${CURRENCY_NAMES[report.currency]}`}>
      <RedemptionsSummary report={report} />
      <RedemptionsChart report={report} />
      <RedemptionsTable report={report} />
    </ReportSectionHeader>
  );
}
