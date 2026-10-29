import { PeriodReportScreen } from '@/pages/reports';
import { DeferredScreen } from '@/shared/ui';

export default function PeriodReportRoute() {
  return (
    <DeferredScreen skeleton="report">
      <PeriodReportScreen />
    </DeferredScreen>
  );
}
