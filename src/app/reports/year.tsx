import { YearReportScreen } from '@/pages/reports';
import { DeferredScreen } from '@/shared/ui';

export default function YearReportRoute() {
  return (
    <DeferredScreen skeleton="report">
      <YearReportScreen />
    </DeferredScreen>
  );
}
