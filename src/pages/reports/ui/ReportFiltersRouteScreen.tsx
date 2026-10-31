import { useLocalSearchParams } from 'expo-router';

import { isReportName } from '@/features/report-filters';

import { EmptyState } from '@/shared/ui';

import ReportFiltersScreen from './ReportFiltersScreen';

export default function ReportFiltersRouteScreen() {
  const { report } = useLocalSearchParams<{ report?: string }>();
  if (!isReportName(report)) {
    return (
      <EmptyState
        icon="search-outline"
        title="Звіт не знайдено"
        message="Поверніться до списку звітів."
      />
    );
  }
  return <ReportFiltersScreen report={report} />;
}
