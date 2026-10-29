import { BondReportScreen } from '@/pages/reports';
import { DeferredScreen } from '@/shared/ui';

export default function BondReportRoute() {
  return (
    <DeferredScreen skeleton="report">
      <BondReportScreen />
    </DeferredScreen>
  );
}
