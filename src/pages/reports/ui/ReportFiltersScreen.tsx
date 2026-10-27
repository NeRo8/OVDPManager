import { useLocalSearchParams } from 'expo-router';

import {
  type ReportName,
  type ReportScope,
  resetReportFilters,
  toggleReportIsin,
  updateReportFilters,
} from '@/features/report-filters';
import { ResetFiltersHeader, ScreenScrollView } from '@/shared/ui';
import { useReport } from '../model/useReport.hook';
import { ReportOwnFiltersSection } from './ReportOwnFiltersSection';
import { ReportScopeSections } from './ReportScopeSections';

/**
 * What a report covers, the report named in the route: its own filters, then the currency and the
 * bonds for every report but the bond one. Every change applies at once and is remembered.
 */
export default function ReportFiltersScreen() {
  const { report } = useLocalSearchParams<{ report: ReportName }>();
  const { wallet, filters, options, activeFilterCount } = useReport(report);
  // The bond report is about one bond, so it has no currency and bonds to narrow.
  const scopedReport = report === 'bond' ? null : report;

  const reset = () => resetReportFilters(report);
  const changeScope = (patch: Partial<ReportScope>) =>
    scopedReport && updateReportFilters(scopedReport, patch);
  const toggleIsin = (isin: string) => scopedReport && toggleReportIsin(scopedReport, isin);

  return (
    <ScreenScrollView>
      <ResetFiltersHeader activeFilterCount={activeFilterCount} onReset={reset} />
      <ReportOwnFiltersSection report={report} />
      {scopedReport && 'isins' in filters && (
        <ReportScopeSections
          wallet={wallet}
          scope={filters}
          options={options}
          onChange={changeScope}
          onToggleIsin={toggleIsin}
        />
      )}
    </ScreenScrollView>
  );
}
