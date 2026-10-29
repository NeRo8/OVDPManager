import { FxReportScreen } from '@/pages/reports';
import { DeferredScreen } from '@/shared/ui';

export default function FxReportRoute() {
  return (
    <DeferredScreen skeleton="report">
      <FxReportScreen />
    </DeferredScreen>
  );
}
