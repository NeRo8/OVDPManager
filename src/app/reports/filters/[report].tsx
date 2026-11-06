import { useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/layout/EmptyState';
import { ScreenScrollView } from '@/components/layout/ScreenScrollView';
import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import ReportFiltersScreen from '@/screens/reports/filters/ReportFiltersScreen';
import { isReportName } from '@/screens/reports/shared/reportParams';

export default function ReportFiltersRoute() {
  const { report } = useLocalSearchParams<{ report: string }>();
  if (typeof report !== 'string' || !isReportName(report))
    return (
      <ScreenScrollView>
        <EmptyState
          layout="inline"
          icon="bar-chart-outline"
          title="Звіт не знайдено"
          message="Оберіть звіт зі списку."
        />
      </ScreenScrollView>
    );
  return (
    <DeferredScreen skeleton="filters">
      <ReportFiltersScreen report={report} />
    </DeferredScreen>
  );
}
